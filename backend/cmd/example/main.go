// Command example runs the spec template inputs and prints the Thai baht text.
package main

import (
	"fmt"

	"balerion-test/thaibaht/thaibaht"

	"github.com/shopspring/decimal"
)

func main() {
	inputs := []decimal.Decimal{
		decimal.NewFromFloat(1234),
		decimal.NewFromFloat(33333.75),
	}
	for _, input := range inputs {
		fmt.Println(input)
		fmt.Println(thaibaht.ToThaiBaht(input))
	}
}
