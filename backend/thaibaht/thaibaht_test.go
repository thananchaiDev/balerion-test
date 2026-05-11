package thaibaht

import (
	"testing"

	"github.com/shopspring/decimal"
)

func TestToThaiBaht(t *testing.T) {
	tests := []struct {
		name string
		in   string
		want string
	}{
		// --- Basics & edge values around 0 ---
		{"zero", "0", "ศูนย์บาทถ้วน"},
		{"one", "1", "หนึ่งบาทถ้วน"},
		{"ten", "10", "สิบบาทถ้วน"},
		{"eleven_uses_et", "11", "สิบเอ็ดบาทถ้วน"},
		{"twenty_uses_yi", "20", "ยี่สิบบาทถ้วน"},
		{"twentyone_uses_yi_and_et", "21", "ยี่สิบเอ็ดบาทถ้วน"},

		// --- Hundreds ---
		{"hundred", "100", "หนึ่งร้อยบาทถ้วน"},
		{"one_hundred_one_uses_et", "101", "หนึ่งร้อยเอ็ดบาทถ้วน"},
		{"one_hundred_eleven", "111", "หนึ่งร้อยสิบเอ็ดบาทถ้วน"},

		// --- Thousands & spec example ---
		{"one_thousand", "1000", "หนึ่งพันบาทถ้วน"},
		{"spec_1234", "1234", "หนึ่งพันสองร้อยสามสิบสี่บาทถ้วน"},

		// --- Spec fractional example ---
		{"spec_33333_75", "33333.75", "สามหมื่นสามพันสามร้อยสามสิบสามบาทเจ็ดสิบห้าสตางค์"},

		// --- Million boundary ---
		{"one_million", "1000000", "หนึ่งล้านบาทถ้วน"},
		// 1,000,001 → trailing 1 after ล้าน → "เอ็ด"
		{"million_plus_one", "1000001", "หนึ่งล้านเอ็ดบาทถ้วน"},
		// 21,000,000 → "ยี่สิบเอ็ดล้าน"
		{"twentyone_million", "21000000", "ยี่สิบเอ็ดล้านบาทถ้วน"},

		// --- Very large: trillion (ล้านล้าน) ---
		{"one_trillion", "1000000000000", "หนึ่งล้านล้านบาทถ้วน"},

		// --- Negative ---
		{"negative_one", "-1", "ลบหนึ่งบาทถ้วน"},
		{"negative_with_satang", "-12.50", "ลบสิบสองบาทห้าสิบสตางค์"},

		// --- Fractional handling ---
		{"satang_one", "0.01", "ศูนย์บาทหนึ่งสตางค์"},
		{"satang_twentyone", "0.21", "ศูนย์บาทยี่สิบเอ็ดสตางค์"},
		// Banker's rounding: 0.005 rounds to 0.00 (round-half-to-even).
		{"bankers_round_half_to_even_down", "0.005", "ศูนย์บาทถ้วน"},
		// 0.015 rounds to 0.02 (round-half-to-even, 2 is even).
		{"bankers_round_half_to_even_up", "0.015", "ศูนย์บาทสองสตางค์"},
		// More-than-2-decimal input gets rounded.
		{"three_decimals_rounds_down", "1.234", "หนึ่งบาทยี่สิบสามสตางค์"},
		{"three_decimals_rounds_up", "1.236", "หนึ่งบาทยี่สิบสี่สตางค์"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			d, err := decimal.NewFromString(tc.in)
			if err != nil {
				t.Fatalf("invalid decimal input %q: %v", tc.in, err)
			}
			got := ToThaiBaht(d)
			if got != tc.want {
				t.Errorf("ToThaiBaht(%s)\n  got:  %q\n  want: %q", tc.in, got, tc.want)
			}
		})
	}
}

// TestSpecExamplesExact pins the two examples from the spec verbatim so
// any future refactor of the rules can't silently break the contract.
func TestSpecExamplesExact(t *testing.T) {
	cases := map[string]string{
		"1234":     "หนึ่งพันสองร้อยสามสิบสี่บาทถ้วน",
		"33333.75": "สามหมื่นสามพันสามร้อยสามสิบสามบาทเจ็ดสิบห้าสตางค์",
	}
	for in, want := range cases {
		d, _ := decimal.NewFromString(in)
		if got := ToThaiBaht(d); got != want {
			t.Errorf("spec example %s:\n  got:  %q\n  want: %q", in, got, want)
		}
	}
}
