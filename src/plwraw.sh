#/bin/sh
stty raw -echo && ./plw $* && reset
