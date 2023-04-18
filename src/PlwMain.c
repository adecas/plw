#include "PlwRefManager.h"
#include "PlwAbstractRef.h"
#include "PlwRecordRef.h"
#include "PlwCommon.h"
#include "PlwStackMachine.h"
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

void PlwReadCodeBlock(FILE *file, PlwCodeBlock *codeBlock, PlwError *error) {
	char *name = NULL;
	PlwInt strConstSize = 0;
	char **strConsts = NULL;
	PlwInt floatConstSize = 0;
	PlwFloat *floatConsts = NULL;
	PlwInt codeSize = 0;
	PlwInt *codes = NULL;
	PlwInt i;
	 
	name = PlwReadNextString(file, error);
	if (PlwIsError(error)) goto error;

	strConstSize = PlwReadNextInt(file, error);
	if (PlwIsError(error)) goto error;
	
	strConsts = PlwAlloc(strConstSize * sizeof(char *), error);
	if (PlwIsError(error)) goto error;
	memset(strConsts, 0, strConstSize * sizeof(char *));
	
	for (i = 0; i < strConstSize; i++) {
		strConsts[i] = PlwReadNextString(file, error);
		if (PlwIsError(error)) goto error;
	}
	
	floatConstSize = PlwReadNextInt(file, error);
	if (PlwIsError(error)) goto error;
	
	floatConsts = PlwAlloc(floatConstSize * sizeof(PlwFloat), error);	
	if (PlwIsError(error)) goto error;
	
	for (i = 0; i < floatConstSize; i++) {
		floatConsts[i] = PlwReadNextFloat(file, error);
		if (PlwIsError(error)) goto error;
	}
		
	codeSize = PlwReadNextInt(file, error);
	if (PlwIsError(error)) goto error;
	
	codes = PlwAlloc(codeSize * sizeof(PlwInt), error);
	if (PlwIsError(error)) goto error;

	for (i = 0; i < codeSize; i++) {
		codes[i] = PlwReadNextInt(file, error);
		if (PlwIsError(error)) goto error;
	}
	
	codeBlock->name = name;
	codeBlock->strConstCount = strConstSize;
	codeBlock->strConsts = strConsts;
	codeBlock->floatConstCount = floatConstSize;
	codeBlock->floatConsts = floatConsts;
	codeBlock->codeCount = codeSize;
	codeBlock->codes = codes;
	return;

error:
	if(name != NULL) PlwFree(name);
	if (strConsts != NULL) {
		for (i = 0; i < strConstSize; i++) {
			if (strConsts[i] != NULL) PlwFree(strConsts[i]);
		}
		PlwFree(strConsts);
	}
	PlwFree(floatConsts);
	PlwFree(codes);	
}

void PlwFreeCodeBlocks(PlwCodeBlock *codeBlocks, PlwInt codeBlockCount) {
	PlwInt i, j;
	for (i = 0; i < codeBlockCount; i++) {
		PlwFree(codeBlocks[i].name);
		PlwFree(codeBlocks[i].codes);
		for (j = 0; j < codeBlocks[i].strConstCount; j++) {
			PlwFree(codeBlocks[i].strConsts[j]);
		}
		PlwFree(codeBlocks[i].strConsts);
		PlwFree(codeBlocks[i].floatConsts);
	}
	PlwFree(codeBlocks);
}	

void PlwReadCodeBlocksFromFile(
	const char *fileName,
	PlwCodeBlock **outCodeBlocks,
	PlwInt *outCodeBlockCount,
	PlwInt *outCodeBlockId,
	PlwError *error
) {
	FILE *file;
	PlwInt i;
	PlwInt codeBlockCount;
	PlwCodeBlock *codeBlocks;
	PlwInt codeBlockId;
	
	file = fopen(fileName, "r");
	if (file == NULL) {
		PlwSetError(error, "FileNotFound", "File not found");
		return;
	}
	
	codeBlockCount = PlwReadNextInt(file, error);
	if (PlwIsError(error)) {
		fclose(file);
		return;
	}
	codeBlockId = PlwReadNextInt(file, error);
	if (PlwIsError(error)) {
		fclose(file);
		return;
	}
	codeBlocks = PlwAlloc(codeBlockCount * sizeof(PlwCodeBlock), error);
	if (PlwIsError(error)) {
		fclose(file);
		return;
	}
	for (i = 0; i < codeBlockCount; i++) {
		PlwReadCodeBlock(file, codeBlocks + i, error);
		if (PlwIsError(error)) {
			PlwFreeCodeBlocks(codeBlocks, i);
			fclose(file);
			return;
		}
#ifdef PLW_DEBUG_SM
		printf("cs %ld: %s\n", i, codeBlocks[i].name);
#endif
	}
	fclose(file);
	*outCodeBlocks = codeBlocks;
	*outCodeBlockCount = codeBlockCount;
	*outCodeBlockId = codeBlockId;
}

void PlwPrintError(PlwError *error) {
	printf("%s: %s\n", error->code, error->message);
}

int main(int argc, char **argv) {
	PlwError error;
	PlwCodeBlock *codeBlocks;
	PlwInt codeBlockCount;
	PlwInt codeBlockId;
	PlwStackMachine *sm;
	PlwInt i;
	char *fileName;
	
	if (argc == 2) {
		fileName = argv[1];
	} else {
		printf("Usage: plw <file.plwc>\n");
		return -1;
	}
	
	srandom(time(NULL));
	
	PlwError_Init(&error);
	
	PlwReadCodeBlocksFromFile(fileName, &codeBlocks, &codeBlockCount, &codeBlockId, &error);
	if (PlwIsError(&error)) {
		PlwPrintError(&error);
		return -1;
	}
	
	sm = PlwStackMachine_Create(&error);
	if (PlwIsError(&error)) {
		PlwPrintError(&error);
		PlwFreeCodeBlocks(codeBlocks, codeBlockCount);
		return -1;
	}
	
	PlwStackMachine_SetNatives(sm, PlwNativeFunctionCount, PlwNativeFunctions);
	PlwStackMachine_SetCodeBlocks(sm, codeBlockCount, codeBlocks);
	
	for (i = codeBlockId; i < codeBlockCount; i++) {
		PlwStackMachine_Execute(sm, i, &error);
		if (PlwIsError(&error)) {
			PlwPrintError(&error);
			PlwStackMachine_Destroy(sm);
			PlwFreeCodeBlocks(codeBlocks, codeBlockCount);
			return -1;
		}
	}	
	
	PlwStackMachine_Destroy(sm);
	PlwFreeCodeBlocks(codeBlocks, codeBlockCount);
	return 0;
}
