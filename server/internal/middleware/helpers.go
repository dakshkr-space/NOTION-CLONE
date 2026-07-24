package middleware

func toUint(val interface{}) uint {
	if val == nil { return 0 }
	switch v := val.(type) {
	case float64: return uint(v)
	case uint: return v
	case int: return uint(v)
	default: return 0
	}
}

func toUintOK(val interface{}) (uint, bool) {
	if val == nil { return 0, false }
	switch v := val.(type) {
	case float64: return uint(v), true
	case uint: return v, true
	case int: return uint(v), true
	default: return 0, false
	}
}
