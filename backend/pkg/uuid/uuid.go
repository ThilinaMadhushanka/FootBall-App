package uuid

import (
	"encoding/json"

	"github.com/google/uuid"
	"github.com/mr-tron/base58"
)

type UUID string

// GenUUIDv7 generates a new UUIDv7 string.
func GenUUIDv7() UUID {
	uid, err := uuid.NewV7()
	if err != nil {
		uid = uuid.New()
		return UUID(uid.String())
	}
	return UUID(uid.String())
}

func FromString(s string) *UUID {
	return (*UUID)(&s)
}

// Parse parses a UUID string and returns it as UUID type.
func Parse(uid string) (UUID, error) {
	_, err := uuid.Parse(uid)
	if err != nil {
		return "", err
	}
	return UUID(uid), nil
}

// Validate validates if the given string is a valid UUID.
func Validate(s string) error {
	_, err := uuid.Parse(s)
	return err
}

// IsNil checks if the UUID is the nil UUID.
func (u UUID) IsNil() bool {
	return u == ""
}

func (u UUID) Base58() string {
	uid, _ := uuid.Parse(string(u))
	return base58.Encode(uid[:])
}

// UnmarshalJSON custom unmarshals a JSON string into a UUID.
func (u *UUID) UnmarshalJSON(b []byte) error {
	var str string
	if err := json.Unmarshal(b, &str); err != nil {
		return err
	}
	parsedUUID, err := uuid.Parse(str)
	if err != nil {
		return err
	}
	*u = UUID(parsedUUID.String())
	return nil
}

// MarshalJSON custom marshals a UUID into a JSON string.
func (u UUID) MarshalJSON() ([]byte, error) {
	return json.Marshal(string(u))
}

// UnmarshalParam implements Gin's binding method for parsing UUIDs from query parameters.
func (u *UUID) UnmarshalParam(param string) error {
	parsedUUID, err := uuid.Parse(param)
	if err != nil {
		return err // return an error if the param is not a valid UUID
	}
	*u = UUID(parsedUUID.String())
	return nil
}

// String provides a string representation for the UUID.
func (u UUID) String() string {
	return string(u)
}

// MarshalText implements encoding.TextMarshaler.
func (u UUID) MarshalText() ([]byte, error) {
	return []byte(u), nil
}

// UnmarshalText implements encoding.TextUnmarshaler.
func (u *UUID) UnmarshalText(data []byte) error {
	parsedUUID, err := uuid.Parse(string(data))
	if err != nil {
		return err
	}
	*u = UUID(parsedUUID.String())
	return nil
}
