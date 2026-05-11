// Command interactive is an interactive CLI that converts decimal values to Thai baht text.
//
// Run it and type a decimal at the prompt. Blank line or Ctrl-D exits.
package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"

	"balerion-test/thaibaht/thaibaht"

	"github.com/shopspring/decimal"
)

func main() {
	fmt.Println("แปลงตัวเลขเป็นข้อความภาษาไทย (บาท)")
	fmt.Println()

	scanner := bufio.NewScanner(os.Stdin)
	for {
		fmt.Print("กรอกตัวเลข > ")
		if !scanner.Scan() {
			fmt.Println()
			break
		}
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			break
		}
		d, err := decimal.NewFromString(line)
		if err != nil {
			fmt.Printf("  ตัวเลขไม่ถูกต้อง: %q\n", line)
			continue
		}
		fmt.Printf("  → %s\n", thaibaht.ToThaiBaht(d))
	}

	if err := scanner.Err(); err != nil {
		fmt.Fprintln(os.Stderr, "read error:", err)
		os.Exit(1)
	}
}
