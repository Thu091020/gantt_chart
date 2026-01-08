
export function parseLagToDays(lagStr: string): number {
    if (!lagStr) return 0;
    
    // Regex tìm các cặp số và đơn vị (ví dụ: 4d, -1w, +1m)
    const regex = /([+-]?\d+)\s*([dwm]?)/gi;
    let totalDays = 0;
    let match;
  
    while ((match = regex.exec(lagStr)) !== null) {
      const value = parseInt(match[1], 10);
      const unit = match[2]?.toLowerCase() || 'd'; // Mặc định là ngày nếu không nhập
  
      switch (unit) {
        case 'w': totalDays += value * 5; break;
        case 'm': totalDays += value * 20; break;
        default: totalDays += value; // 'd'
      }
    }
    return totalDays;
  }