package handlers

import "net/http"

func CreatePage(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusCreated)
	w.Write([]byte("Page created"))
}
