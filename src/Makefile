all: plw

plw: Makefile PlwCommon.h PlwCommon.c PlwRefManager.h PlwRefManager.c  PlwAbstractRef.h PlwAbstractRef.c PlwRecordRef.h PlwRecordRef.c PlwStringRef.h PlwStringRef.c PlwExceptionHandlerRef.h PlwExceptionHandlerRef.c PlwBasicArrayRef.h PlwBasicArrayRef.c PlwArrayRef.h PlwArrayRef.c PlwMappedRecordRef.h PlwMappedRecordRef.c PlwOpcode.h PlwOpcode.c PlwCodeBlock.h PlwCodeBlock.c PlwStackMachine.h PlwStackMachine.c PlwNative.h PlwNative.c PlwMain.c
	gcc -o plw -g -O3 -ansi -pedantic -Wall -Wextra -Werror -Wno-unused-parameter -D_XOPEN_SOURCE=500 PlwCommon.c PlwExceptionHandlerRef.c PlwRefManager.c  PlwAbstractRef.c PlwRecordRef.c PlwStringRef.c PlwBasicArrayRef.c PlwArrayRef.c PlwMappedRecordRef.c PlwOpcode.c PlwCodeBlock.c PlwStackMachine.c PlwNative.c PlwMain.c -lm
	
clean:
	rm -f plw
	
clear:
	clear
	
run: clear plw
	valgrind --leak-check=full ./plw ../examples/test.plwc

