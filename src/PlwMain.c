#include "PlwRefManager.h"
#include "PlwCommon.h"
#include "PlwStackMachine.h"
#include "PlwLangOpcode.h"
#include "PlwNative.h"
#include <string.h>
#include <stdio.h>
#include <time.h>

void PlwSetError(PlwError *error, const char *code, char *message) {
	error->code = code;
	snprintf(error->message, PLW_ERROR_MESSAGE_MAX, "%s", message);
}

PlwBoolean IsCharBlank(int c) {
	return c == ' ' || c == '\t' || c == '\r' || c == '\n';
}

int PlwSkipBlank(FILE *file) {
	int c;
	for (;;) {
		c = fgetc(file);
		if (!IsCharBlank(c)) {
			return c;
		}
	}
}

PlwInt PlwReadNextInt(FILE *file, PlwError *error) {
	char buffer[256];
	char *p = buffer;
	int c;
	c = PlwSkipBlank(file);
	if (c == EOF) {
		PlwSetError(error, "EndOfFile", "Unexpected end of file");
		return 0;
	}
	for(;;) {
		if (!IsCharBlank(c)) {
			*p = c;
			p++;
			if (p >= buffer + 255) break;
			c = fgetc(file);
		} else {
			break;
		}
	}
	*p = 0;
	return atol(buffer);
}

PlwFloat PlwReadNextFloat(FILE *file, PlwError *error) {
	char buffer[256];
	char *p = buffer;
	int c;
	PlwFloat f;
	c = PlwSkipBlank(file);
	if (c == EOF) {
		PlwSetError(error, "EndOfFile", "Unexpected end of file");
		return 0;
	}
	for(;;) {
		if (!IsCharBlank(c)) {
			*p = c;
			p++;
			if (p >= buffer + 255) break;
			c = fgetc(file);
		} else {
			break;
		}
	}
	*p = 0;
	f = strtod(buffer, NULL);
	return f;
}

char *PlwReadNextString(FILE *file, PlwError *error) {
	PlwInt len;
	PlwInt i;
	char *s;
	int c;
	len = PlwReadNextInt(file, error);
	if (PlwIsError(error)) {
		return NULL;
	}
	s = PlwAlloc(len + 1, error);
	for (i = 0; i < len; i++) {
		c = fgetc(file);
		if (c == EOF) {
			PlwFree(s);
			PlwSetError(error, "EndOfFile", "Unexpected end of file");
			return NULL;
		}
		s[i] = c;
	}
	s[i] = '\0';
	return s;
}

PlwCodeBlock *PlwReadCodeBlock(FILE *file, PlwError *error) {
	PlwInt i;
	PlwCodeBlock *cb = PlwCodeBlock_Create(error);
	 
	cb->strConstCount = PlwReadNextInt(file, error);
	if (PlwIsError(error)) {
		PlwCodeBlock_Destroy(cb);
		return NULL;
	}
	
	cb->strConsts = PlwAlloc(cb->strConstCount * sizeof(char *), error);
	if (PlwIsError(error)) {
		PlwCodeBlock_Destroy(cb);
		return NULL;
	}
	memset(cb->strConsts, 0, cb->strConstCount * sizeof(char *));
	
	for (i = 0; i < cb->strConstCount; i++) {
		cb->strConsts[i] = PlwReadNextString(file, error);
		if (PlwIsError(error)) {
			PlwCodeBlock_Destroy(cb);
			return NULL;
		}
	}
	
	cb->floatConstCount = PlwReadNextInt(file, error);
	if (PlwIsError(error)) {
		PlwCodeBlock_Destroy(cb);
		return NULL;
	}
	
	cb->floatConsts = PlwAlloc(cb->floatConstCount * sizeof(PlwFloat), error);	
	if (PlwIsError(error)) {
		PlwCodeBlock_Destroy(cb);
		return NULL;
	}
	
	for (i = 0; i < cb->floatConstCount; i++) {
		cb->floatConsts[i] = PlwReadNextFloat(file, error);
		if (PlwIsError(error)) {
			PlwCodeBlock_Destroy(cb);
			return NULL;
		}
	}
	
	cb->entryPoint = PlwReadNextInt(file, error);
	if (PlwIsError(error)) {
		PlwCodeBlock_Destroy(cb);
		return NULL;
	}
		
	cb->codeCount = PlwReadNextInt(file, error);
	if (PlwIsError(error)) {
		PlwCodeBlock_Destroy(cb);
		return NULL;
	}
	
	cb->codes = PlwAlloc(cb->codeCount * sizeof(PlwInt), error);
	if (PlwIsError(error)) {
		PlwCodeBlock_Destroy(cb);
		return NULL;
	}

	for (i = 0; i < cb->codeCount; i++) {
		cb->codes[i] = PlwReadNextInt(file, error);
		if (PlwIsError(error)) {
			PlwCodeBlock_Destroy(cb);
			return NULL;
		}
	}
	
	return cb;
}

PlwCodeBlock *PlwReadCodeBlockFromFile(
	const char *fileName,
	PlwError *error
) {
	FILE *file;
	PlwCodeBlock *cb;
	
	file = fopen(fileName, "r");
	if (file == NULL) {
		PlwSetError(error, "FileNotFound", "File not found");
		return NULL;
	}
	
	cb = PlwReadCodeBlock(file, error);
	if (PlwIsError(error)) {
		fclose(file);
		return NULL;
	}

	return cb;
}

void PlwPrintError(PlwError *error) {
	printf("%s: %s\n", error->code, error->message);
}

int main(int argc, char **argv) {
	PlwError error;
	PlwCodeBlock *cb;
	PlwStackMachine *sm;
	char *fileName;
	
	if (argc == 2) {
		fileName = argv[1];
	} else {
		printf("Usage: plw <file.plwc>\n");
		return -1;
	}
	
	srandom(time(NULL));
	
	PlwError_Init(&error);
	
	cb = PlwReadCodeBlockFromFile(fileName, &error);
	if (PlwIsError(&error)) {
		PlwPrintError(&error);
		return -1;
	}
	
	sm = PlwStackMachine_Create(&error);
	if (PlwIsError(&error)) {
		PlwPrintError(&error);
		PlwCodeBlock_Destroy(cb);
		return -1;
	}
	
	PlwStackMachine_SetExtops(sm, PlwLangOpcodeCount, PlwLangOps);
	PlwStackMachine_SetNatives(sm, PlwNativeFunctionCount, PlwNativeFunctions);
	PlwStackMachine_SetCodeBlock(sm, cb);
	PlwStackMachine_RunLoop(sm, &error);
	if (PlwIsError(&error)) {
		PlwPrintError(&error);
		PlwStackMachine_Destroy(sm);
		return -1;
	}
	
	PlwStackMachine_Destroy(sm);
	return 0;
}
