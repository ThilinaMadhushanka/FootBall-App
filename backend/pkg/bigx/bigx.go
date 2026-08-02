package bigx

import (
	"database/sql/driver"
	"errors"
	"fmt"
	"math/big"

	"github.com/shopspring/decimal"
)

func ParseInt(s string) *big.Int {
	v, _ := new(big.Int).SetString(s, 10)
	return v
}

// Int wraps around big.Int to provide custom marshalling/unmarshalling.
type Int struct {
	value *big.Int
}

func New(v *big.Int) *Int {
	return &Int{v}
}

func Zero() *Int {
	return New(big.NewInt(0))
}

// NewIntFromString creates a new Int from a string representation of a big.Int.
func NewIntFromString(s string) (*Int, error) {
	bi, ok := new(big.Int).SetString(s, 10)
	if !ok {
		return nil, errors.New("invalid big.Int string")
	}
	return &Int{value: bi}, nil
}

func NewIntFromUint(n uint64) *Int {
	return &Int{value: new(big.Int).SetUint64(uint64(n))}
}
func NewIntFromInt64(n int64) *Int {
	return &Int{value: new(big.Int).SetInt64(n)}
}

// Add returns a new Int by adding the current value to another Int.
func (i *Int) Add(other *Int) *Int {

	return &Int{value: new(big.Int).Add(i.value, other.value)}
}

// Add returns a new Int by adding the current value to another Int.
func (i *Int) AddNilable(other *Int) *Int {
	var lhs = big.NewInt(0)
	var rhs = big.NewInt(0)
	if i != nil && i.value != nil {
		lhs = i.value
	}
	if other != nil && other.value != nil {
		rhs = other.value
	}
	return &Int{value: new(big.Int).Add(lhs, rhs)}
}

// Sub returns a new Int by subtracting another Int from the current value.
func (i *Int) Sub(other *Int) *Int {
	return &Int{value: new(big.Int).Sub(i.value, other.value)}
}

// Mul returns a new Int by multiplying the current value by another Int.
func (i *Int) Mul(other *Int) *Int {
	return &Int{value: new(big.Int).Mul(i.value, other.value)}
}

// MulInt64 returns a new Int by multiplying the current value by another Int.
func (i *Int) MulInt64(other int64) *Int {
	val := big.NewInt(other)

	return &Int{value: new(big.Int).Mul(i.value, val)}
}

// Div returns a new Int by dividing the current value by another Int.
// Returns an error if the divisor is zero.
func (i *Int) Div(other *Int) (*Int, error) {
	if other.value.Cmp(big.NewInt(0)) == 0 {
		return nil, errors.New("division by zero")
	}
	return &Int{value: new(big.Int).Div(i.value, other.value)}, nil
}

func (i *Int) DivInt64(other int64) *Int {
	if other == 0 {

		return Zero()
	}
	val := big.NewInt(other)
	return &Int{value: new(big.Int).Div(i.value, val)}
}

// Mod returns a new Int representing the modulus of the current value by another Int.
// Returns an error if the divisor is zero.
func (i *Int) Mod(other *Int) (*Int, error) {
	if other.value.Cmp(big.NewInt(0)) == 0 {
		return nil, errors.New("modulus by zero")
	}
	return &Int{value: new(big.Int).Mod(i.value, other.value)}, nil
}

// Neg returns a new Int representing the negation of the current value.
func (i *Int) Neg() *Int {
	return &Int{value: new(big.Int).Neg(i.value)}
}

// Cmp compares the current Int with another Int.
// Returns -1 if i < other, 0 if i == other, 1 if i > other.
func (i *Int) Cmp(other *Int) int {
	return i.value.Cmp(other.value)
}

// Abs returns a new Int representing the absolute value of the current Int.
func (i *Int) Abs() *Int {
	return &Int{value: new(big.Int).Abs(i.value)}
}

// Additional Utility Methods

// IsZero returns true if the value is zero.
func (i *Int) IsZero() bool {
	if i == nil || i.value == nil {
		return true
	}
	return i.value.Cmp(big.NewInt(0)) == 0
}

// IsNil returns true if the value is Nil
func (i *Int) IsNil() bool {
	if i == nil || i.value == nil {
		return true
	}
	return false
}

// IsNegative returns true if the value is less than zero.
func (i *Int) IsNegative() bool {
	return i.value.Sign() < 0
}

// IsPositive returns true if the value is greater than zero.
func (i *Int) IsPositive() bool {
	return i.value.Sign() > 0
}

func (i Int) MarshalJSON() ([]byte, error) {
	str := "\"" + i.ToDecimalString() + "\""
	return []byte(str), nil
}

func unquoteIfQuoted(value interface{}) (string, error) {
	var bytes []byte

	switch v := value.(type) {
	case string:
		bytes = []byte(v)
	case []byte:
		bytes = v
	default:
		return "", fmt.Errorf("could not convert value '%+v' to byte array of type '%T'", value, value)
	}

	// If the amount is quoted, strip the quotes
	if len(bytes) > 2 && bytes[0] == '"' && bytes[len(bytes)-1] == '"' {
		bytes = bytes[1 : len(bytes)-1]
	}
	return string(bytes), nil
}

// UnmarshalJSON implements the json.Unmarshaler interface.
func (i *Int) UnmarshalJSON(decimalBytes []byte) error {
	if string(decimalBytes) == "null" {
		return nil
	}

	str, err := unquoteIfQuoted(decimalBytes)
	if err != nil {
		return fmt.Errorf("error decoding string '%s': %s", decimalBytes, err)
	}
	if i == nil {
		return errors.New("cannot unmarshal into nil *Int")
	}

	// Always parse as decimal to ensure consistent scaling (e.g., "100" -> 100.00 dollars -> 10000 cents)
	d, err := decimal.NewFromString(str)
	if err != nil {
		return fmt.Errorf("error decoding string '%s': %s", str, err)
	}
	// Assume currency with 2 decimal places; scale to cents
	scaled := d.Mul(decimal.NewFromInt(100))
	i.value = scaled.BigInt()
	return nil
}

// MarshalText implements the encoding.TextMarshaler interface for text marshaling.
func (i Int) MarshalText() ([]byte, error) {
	return []byte(i.value.String()), nil
}

// UnmarshalText implements the encoding.TextUnmarshaler interface for text unmarshaling.
func (i *Int) UnmarshalText(data []byte) error {
	str := string(data)
	bi, ok := new(big.Int).SetString(str, 10)
	if !ok {
		return errors.New("invalid big.Int text")
	}
	i.value = bi
	return nil
}
func (i *Int) Val() *big.Int {
	return i.value
}

func (i *Int) ToDecimalNilable(exp int32) decimal.Decimal {
	if i == nil {
		return decimal.Zero
	}
	return decimal.NewFromBigInt(i.Val(), exp)
}

func (i *Int) ToDecimal(exp int32) decimal.Decimal {
	return decimal.NewFromBigInt(i.Val(), exp)
}

// Value implements the driver.Valuer interface for SQL serialization.
func (i Int) Value() (driver.Value, error) {
	if i.value == nil {
		return "0.00", nil
	}
	return i.ToDecimalString(), nil
}

// Scan implements the sql.Scanner interface for SQL deserialization.
func (i *Int) Scan(value interface{}) error {
	if value == nil {
		i.value = new(big.Int)
		return nil
	}

	switch v := value.(type) {
	case string:
		// try integer string first
		if bi, ok := new(big.Int).SetString(v, 10); ok {
			i.value = bi
			return nil
		}
		// fall back to decimal parsing (e.g., "12.00") and convert to integer cents
		d, err := decimal.NewFromString(v)
		if err != nil {
			return fmt.Errorf("invalid big.Int value: %v", v)
		}
		// assume currency with 2 decimal places; scale to cents
		scaled := d.Mul(decimal.NewFromInt(100))
		bi := scaled.BigInt()
		i.value = bi
	case []byte:
		s := string(v)
		if bi, ok := new(big.Int).SetString(s, 10); ok {
			i.value = bi
			return nil
		}
		d, err := decimal.NewFromString(s)
		if err != nil {
			return fmt.Errorf("invalid big.Int value: %v", v)
		}
		scaled := d.Mul(decimal.NewFromInt(100))
		bi := scaled.BigInt()
		i.value = bi
	case int64:
		i.value = new(big.Int).SetInt64(v)
	case int32:
		i.value = new(big.Int).SetInt64(int64(v))
	case int:
		i.value = new(big.Int).SetInt64(int64(v))
	default:
		return fmt.Errorf("unsupported type for big.Int: %T", v)
	}
	return nil
}

// String returns the decimal string representation of the big.Int value.
func (i Int) String() string {
	return i.ToDecimalString()
}

// ToDecimalString returns the value as a decimal string with 2 decimal places.
func (i Int) ToDecimalString() string {
	if i.value == nil {
		return "0.00"
	}
	return i.ToDecimal(-2).StringFixed(2)
}

// MarshalBinary implements the encoding.BinaryMarshaler interface for binary marshaling.
func (i Int) MarshalBinary() ([]byte, error) {
	// Marshal the big.Int into a byte slice.
	if i.value == nil {
		return nil, nil
	}

	// Get the byte representation of the big.Int
	byteArray := i.value.Bytes()
	return byteArray, nil
}

// UnmarshalBinary implements the encoding.BinaryUnmarshaler interface for binary unmarshaling.
func (i *Int) UnmarshalBinary(data []byte) error {
	if len(data) == 0 {
		i.value = new(big.Int)
		return nil
	}

	// Convert the byte slice back into a big.Int
	i.value = new(big.Int).SetBytes(data)
	return nil
}
