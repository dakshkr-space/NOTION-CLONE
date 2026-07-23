package utils

func ToUint(val interface{}) uint {
	if f, ok := val.(float64); ok { return uint(f) }
	if i, ok := val.(int); ok { return uint(i) }
	if u, ok := val.(uint); ok { return u }
	return 0
}
