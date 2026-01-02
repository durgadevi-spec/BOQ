#!/usr/bin/env pwsh

# Create material templates via API
$apiUrl = "http://localhost:5000/api"

# Test with curl
Write-Host "[test] Testing material templates creation..." -ForegroundColor Green

# First get a token
Write-Host "[test] Step 1: Logging in as admin..."
$loginRes = Invoke-WebRequest -Uri "$apiUrl/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"admin"}' `
  -SkipHttpErrorCheck

if ($loginRes.StatusCode -eq 200) {
  $loginData = $loginRes.Content | ConvertFrom-Json
  $token = $loginData.token
  Write-Host "✓ Got token: $($token.Substring(0, 20))..." -ForegroundColor Green
  
  # Create templates
  $templates = @(
    @{ name = "Industrial Paint"; code = "TPL-PAINT-001"; category = "Paint" }
    @{ name = "Hydraulic Cement"; code = "TPL-CEMENT-001"; category = "Concrete" }
    @{ name = "Stainless Steel Bolt"; code = "TPL-BOLT-M10"; category = "Fasteners" }
  )
  
  foreach ($template in $templates) {
    Write-Host "[test] Creating: $($template.name)..."
    $body = $template | ConvertTo-Json
    
    $createRes = Invoke-WebRequest -Uri "$apiUrl/material-templates" `
      -Method POST `
      -ContentType "application/json" `
      -Headers @{ Authorization = "Bearer $token" } `
      -Body $body `
      -SkipHttpErrorCheck
    
    if ($createRes.StatusCode -eq 201) {
      Write-Host "✓ Created: $($template.name)" -ForegroundColor Green
    } elseif ($createRes.StatusCode -eq 409) {
      Write-Host "⚠ Already exists: $($template.name)" -ForegroundColor Yellow
    } else {
      Write-Host "✗ Error: $($createRes.StatusCode)" -ForegroundColor Red
      Write-Host $createRes.Content
    }
  }
  
  # Verify
  Write-Host "[test] Fetching all templates..."
  $getRes = Invoke-WebRequest -Uri "$apiUrl/material-templates" `
    -Method GET `
    -Headers @{ Authorization = "Bearer $token" }
  
  $templates = ($getRes.Content | ConvertFrom-Json).templates
  Write-Host "✓ Found $($templates.Count) templates" -ForegroundColor Green
  $templates | ForEach-Object { Write-Host "  - $($_.name)" }
} else {
  Write-Host "✗ Login failed" -ForegroundColor Red
}
