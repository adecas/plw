all: plw

plw: Makefile PlwCommon.h PlwCommon.c PlwRefManager.h PlwRefManager.c  PlwAbstractRef.h PlwAbstractRef.c PlwBlobRef.h PlwBlobRef.c PlwStringRef.h PlwStringRef.c PlwExceptionHandlerRef.h PlwExceptionHandlerRef.c PlwOpcode.h PlwOpcode.c PlwCodeBlock.h PlwCodeBlock.c PlwStackMachine.h PlwStackMachine.c PlwLangOpcode.h PlwLangOpcode.c PlwNative.h PlwNative.c PlwMain.c
	gcc -o ../bin/plw -g -O3 -ansi -pedantic -Wall -Wextra -Werror -Wno-unused-parameter -D_XOPEN_SOURCE=500 PlwCommon.c PlwExceptionHandlerRef.c PlwRefManager.c  PlwAbstractRef.c PlwBlobRef.c PlwStringRef.c PlwOpcode.c PlwCodeBlock.c PlwStackMachine.c PlwLangOpcode.c PlwNative.c PlwMain.c -lm
	
clean:
	rm -f ../bin/plw
	
clear:
	clear
	
run: clear plw
	valgrind --leak-check=full ./bin/plw ../examples/test.plwc

