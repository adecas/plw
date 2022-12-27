#ifndef PLWCODEBLOCK_H_
#define PLWCODEBLOCK_H_

#include "PlwCommon.h"

typedef struct PlwCodeBlock {
	char *name;
	PlwInt codeCount;
	PlwInt *codes;
	PlwInt strConstCount;
	char **strConsts;
} PlwCodeBlock;

void PlwCodeBlock_Init(PlwCodeBlock *cb, char *name);
		
#endif