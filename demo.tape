Output demo.mp4

Set Shell "bash"
Set FontSize 40
Set Width 3600
Set Height 2400
Set WindowBar Colorful
Set Margin 20
Set MarginFill "#1a1a2e"
Set BorderRadius 10
Set Theme "Dracula"
Set PlaybackSpeed 1.5

Hide
  Type "cd /home/xevrion/Coding/iitj-phc-system"
  Enter
  Sleep 500ms
Show

Type "bash backend/smoke_test.sh"
Sleep 500ms
Enter
Sleep 60s
