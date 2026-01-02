import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Server-side validation functions
function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: "Email is required" };
  }
  if (email.length > 255) {
    return { valid: false, error: "Email must be less than 255 characters" };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Invalid email format" };
  }
  return { valid: true };
}

function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: "Password is required" };
  }
  if (password.length < 6) {
    return { valid: false, error: "Password must be at least 6 characters" };
  }
  if (password.length > 72) {
    return { valid: false, error: "Password must be less than 72 characters" };
  }
  return { valid: true };
}

function validateFullName(fullName: string | undefined): { valid: boolean; error?: string } {
  if (fullName === undefined || fullName === null) {
    return { valid: true };
  }
  if (typeof fullName !== 'string') {
    return { valid: false, error: "Full name must be a string" };
  }
  if (fullName.length > 100) {
    return { valid: false, error: "Full name must be less than 100 characters" };
  }
  return { valid: true };
}

function validateRole(role: string | undefined): { valid: boolean; error?: string } {
  if (role === undefined || role === null) {
    return { valid: true };
  }
  if (!['user', 'admin'].includes(role)) {
    return { valid: false, error: "Role must be 'user' or 'admin'" };
  }
  return { valid: true };
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    
    if (!authHeader) {
      console.log("No authorization header found");
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    console.log("Token length:", token.length);
    
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError) {
      console.log("Auth error:", userError.message);
      return new Response(JSON.stringify({ error: "Invalid token", details: userError.message }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    if (!userData.user) {
      console.log("No user found for token");
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log("User authenticated:", userData.user.email);

    // Check if caller is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case "create": {
        const { email, password, fullName, role } = params;
        
        // Server-side validation
        const emailValidation = validateEmail(email);
        if (!emailValidation.valid) {
          return new Response(JSON.stringify({ error: emailValidation.error }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          return new Response(JSON.stringify({ error: passwordValidation.error }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const fullNameValidation = validateFullName(fullName);
        if (!fullNameValidation.valid) {
          return new Response(JSON.stringify({ error: fullNameValidation.error }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const roleValidation = validateRole(role);
        if (!roleValidation.valid) {
          return new Response(JSON.stringify({ error: roleValidation.error }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        // Create user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email.trim(),
          password,
          email_confirm: true,
          user_metadata: { full_name: (fullName || "").trim() },
        });

        if (createError) throw createError;

        if (newUser.user) {
          // Wait for trigger to create profile (with retry)
          let profileCreated = false;
          for (let i = 0; i < 10; i++) {
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("id")
              .eq("user_id", newUser.user.id)
              .maybeSingle();
            
            if (profile) {
              profileCreated = true;
              break;
            }
            await new Promise(resolve => setTimeout(resolve, 200));
          }

          // If trigger didn't create profile, create it manually
          if (!profileCreated) {
            await supabaseAdmin
              .from("profiles")
              .insert({
                user_id: newUser.user.id,
                email: email,
                full_name: fullName || "",
                is_approved: true
              });
            
            // Add default user role
            await supabaseAdmin
              .from("user_roles")
              .insert({ user_id: newUser.user.id, role: "user" });
          } else {
            // Auto-approve the user
            await supabaseAdmin
              .from("profiles")
              .update({ is_approved: true })
              .eq("user_id", newUser.user.id);
          }

          // If role is admin, add admin role (in addition to user role)
          if (role === "admin") {
            await supabaseAdmin
              .from("user_roles")
              .upsert({ user_id: newUser.user.id, role: "admin" }, { onConflict: "user_id,role" });
          }
        }

        return new Response(JSON.stringify({ success: true, user: newUser.user }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update": {
        const { userId, email, fullName } = params;
        
        // Server-side validation for update
        if (email) {
          const emailValidation = validateEmail(email);
          if (!emailValidation.valid) {
            return new Response(JSON.stringify({ error: emailValidation.error }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }

        const fullNameValidation = validateFullName(fullName);
        if (!fullNameValidation.valid) {
          return new Response(JSON.stringify({ error: fullNameValidation.error }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const updates: any = {};
        if (email) updates.email = email.trim();
        if (fullName !== undefined) updates.user_metadata = { full_name: (fullName || "").trim() };

        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          updates
        );

        if (updateError) throw updateError;

        // Also update profile
        if (email || fullName !== undefined) {
          const profileUpdates: any = {};
          if (email) profileUpdates.email = email.trim();
          if (fullName !== undefined) profileUpdates.full_name = (fullName || "").trim();
          
          await supabaseAdmin
            .from("profiles")
            .update(profileUpdates)
            .eq("user_id", userId);
        }

        return new Response(JSON.stringify({ success: true, user: updatedUser.user }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "resetPassword": {
        const { userId, newPassword } = params;
        
        // Server-side validation for password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
          return new Response(JSON.stringify({ error: passwordValidation.error }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        
        const { data: updatedUser, error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password: newPassword }
        );

        if (resetError) throw resetError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "delete": {
        const { userId } = params;
        
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) throw deleteError;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (error: any) {
    console.error("Error:", error);
    
    // Check for common validation errors and return 400 instead of 500
    const errorMessage = error.message || "Unknown error";
    const isValidationError = 
      errorMessage.includes("already been registered") ||
      errorMessage.includes("already registered") ||
      errorMessage.includes("invalid") ||
      errorMessage.includes("Invalid");
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: isValidationError ? 400 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});