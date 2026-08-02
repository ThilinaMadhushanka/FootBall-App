package bigx

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestInt_MarshalJSON(t *testing.T) {
	tests := []struct {
		name     string
		val      *Int
		expected string
	}{
		{"10.00", NewIntFromInt64(1000), `"10.00"`},
		{"0.00", Zero(), `"0.00"`},
		{"123.45", NewIntFromInt64(12345), `"123.45"`},
		{"0.05", NewIntFromInt64(5), `"0.05"`},
		{"-1.00", NewIntFromInt64(-100), `"-1.00"`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			b, err := json.Marshal(tt.val)
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, string(b))
		})
	}
}

func TestInt_UnmarshalJSON(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected int64
	}{
		{"Decimal", `"10.00"`, 1000},
		{"Integer as string", `"10"`, 1000}, // Changed from 10 to 1000 (10 dollars)
		{"Number", `"10.50"`, 1050},         // Numbers should also be tokens/strings usually, but decimal.NewFromString handles it if passed as string
		{"Zero", `"0.00"`, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var i Int
			err := json.Unmarshal([]byte(tt.input), &i)
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, i.Val().Int64())
		})
	}
}

func TestInt_Value(t *testing.T) {
	i := NewIntFromInt64(12345)
	val, err := i.Value()
	assert.NoError(t, err)
	assert.Equal(t, "123.45", val)
}
