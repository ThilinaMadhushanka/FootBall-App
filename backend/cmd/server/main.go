package main

import (
	"football-app-backend/internal/bootstrap"
)

func main() {
	app := bootstrap.NewApp()
	app.Run()
}
