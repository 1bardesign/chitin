::TODO: port this to a grunt task or whatever
::with local config or js dep for zip tools

mkdir _deploy
mkdir _deploy\js
mkdir _deploy\assets
mkdir _deploy\lib
copy index_itch.html _deploy\index.html
copy js\* _deploy\js\*
copy assets\* _deploy\assets\*
copy lib\* _deploy\lib\*
cd _deploy
call "C:\Program Files\7-Zip\7z.exe" a "distro.zip" ./*
cd ..
move "_deploy\distro.zip" "distro.zip"
rmdir /S /Q _deploy
pause
