// Package thaibaht converts decimal monetary values into Thai-language
// baht text (e.g. "หนึ่งพันสองร้อยสามสิบสี่บาทถ้วน").
//
// The conversion follows standard Thai numeral pronunciation rules:
//   - Trailing "1" in any non-units position is read as "เอ็ด"
//     (e.g. 11 → "สิบเอ็ด", 21 → "ยี่สิบเอ็ด", 101 → "หนึ่งร้อยเอ็ด").
//   - Tens digit "2" is read as "ยี่สิบ" (not "สองสิบ").
//   - Tens digit "1" is read as "สิบ" (not "หนึ่งสิบ").
//   - Numbers ≥ 1,000,000 are split into million-groups and the prefix
//     "ล้าน" is appended for each group (handled by recursion).
//
// Fractional values are rounded to two decimal places using banker's
// rounding (RoundBank) before conversion to satang text.
package thaibaht

import (
	"strings"

	"github.com/shopspring/decimal"
)

// digitWords maps a single digit 0–9 to its Thai word form.
var digitWords = [...]string{
	"ศูนย์", "หนึ่ง", "สอง", "สาม", "สี่",
	"ห้า", "หก", "เจ็ด", "แปด", "เก้า",
}

// placeWords maps a position (units → แสน) within a 6-digit group
// to its Thai place-value word. Index 0 is the units place.
var placeWords = [...]string{
	"", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน",
}

// ToThaiBaht converts a decimal value into its Thai baht text representation.
//
// Behaviour:
//   - Negative values are prefixed with "ลบ".
//   - Zero baht with no fractional part → "ศูนย์บาทถ้วน".
//   - Values without a fractional part get the "ถ้วน" suffix.
//   - Values with a fractional part are rounded to 2 decimals (banker's
//     rounding) and appended with "<satang text>สตางค์".
func ToThaiBaht(d decimal.Decimal) string {
	// Normalise: round to 2 decimals up-front to avoid surprises like
	// 0.005 vs 0.004999... and to mirror real-world currency handling.
	d = d.RoundBank(2)

	var sb strings.Builder
	if d.IsNegative() {
		sb.WriteString("ลบ")
		d = d.Neg()
	}

	// Split into integer (baht) and fractional (satang) parts. Satang is
	// always 0–99 because we rounded to 2 decimals above.
	bahtPart := d.Truncate(0)
	satangPart := d.Sub(bahtPart).Mul(decimal.NewFromInt(100)).IntPart()

	sb.WriteString(integerToThai(bahtPart))
	sb.WriteString("บาท")

	if satangPart == 0 {
		sb.WriteString("ถ้วน")
	} else {
		sb.WriteString(twoDigitToThai(int(satangPart)))
		sb.WriteString("สตางค์")
	}

	return sb.String()
}

// integerToThai converts a non-negative integer decimal into Thai text
// (without any currency suffix). Handles arbitrarily large values by
// recursing on million-groups.
func integerToThai(n decimal.Decimal) string {
	if n.IsZero() {
		return digitWords[0] // "ศูนย์"
	}

	million := decimal.NewFromInt(1000000)
	if n.LessThan(million) {
		// Fits in one 6-digit group → direct conversion.
		return groupToThai(int(n.IntPart()), false)
	}

	// Split: high = n / 1_000_000, low = n % 1_000_000.
	// Recurse on the high part (so 1,000,000,000,000 reads correctly as
	// "หนึ่งล้านล้าน") then read the low group with "เอ็ด" handling
	// enabled (so trailing 1 in the low group becomes "เอ็ด").
	high := n.Div(million).Truncate(0)
	low := n.Mod(million).IntPart()

	var sb strings.Builder
	sb.WriteString(integerToThai(high))
	sb.WriteString("ล้าน")
	if low > 0 {
		sb.WriteString(groupToThai(int(low), true))
	}
	return sb.String()
}

// groupToThai converts a value 0–999_999 to Thai text.
//
// When followsLargerGroup is true, the value follows a higher-order
// "ล้าน" group, which means a bare trailing "1" should still be read as
// "เอ็ด" (e.g. 1,000,001 → "หนึ่งล้านเอ็ด"). This also handles cases
// like 1,000,021 → "หนึ่งล้านยี่สิบเอ็ด" naturally because the tens
// digit owns its own special rule.
func groupToThai(n int, followsLargerGroup bool) string {
	if n == 0 {
		return ""
	}

	var sb strings.Builder
	// Walk digits from most significant (แสน, position 5) down to units.
	started := false
	for pos := 5; pos >= 0; pos-- {
		digit := (n / pow10(pos)) % 10
		if digit == 0 {
			continue
		}

		switch pos {
		case 1: // tens place — special words
			switch digit {
			case 1:
				sb.WriteString("สิบ")
			case 2:
				sb.WriteString("ยี่สิบ")
			default:
				sb.WriteString(digitWords[digit])
				sb.WriteString("สิบ")
			}
		case 0: // units place — "เอ็ด" rule
			// A trailing 1 is read as "เอ็ด" when:
			//   - some higher digit in this group has already been written
			//     (started == true), OR
			//   - this group follows a larger ล้าน group (e.g. 1,000,001).
			// Special case: a standalone "1" (n == 1 with no higher group)
			// must still read as "หนึ่ง".
			if digit == 1 && (started || followsLargerGroup) {
				sb.WriteString("เอ็ด")
			} else {
				sb.WriteString(digitWords[digit])
			}
		default: // hundreds, thousands, ten-thousands, hundred-thousands
			sb.WriteString(digitWords[digit])
			sb.WriteString(placeWords[pos])
		}
		started = true
	}
	return sb.String()
}

// twoDigitToThai converts a value 0–99 (used for satang) to Thai text.
// It reuses groupToThai with followsLargerGroup=false so that 1 alone
// reads as "หนึ่ง" and 21 reads as "ยี่สิบเอ็ด".
func twoDigitToThai(n int) string {
	return groupToThai(n, false)
}

// pow10 returns 10^p for small p (0–5). Avoids importing math just for
// this hot inner-loop helper and keeps the code allocation-free.
func pow10(p int) int {
	r := 1
	for i := 0; i < p; i++ {
		r *= 10
	}
	return r
}
