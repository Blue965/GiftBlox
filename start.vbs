Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell -WindowStyle Hidden -Command Set-Location 'C:\Users\robin\Desktop\GiftBlox'; node index.js", 0, False
WshShell.Run "powershell -WindowStyle Hidden -Command Set-Location 'C:\Users\robin\Desktop\GiftBlox'; node api.js", 0, False
