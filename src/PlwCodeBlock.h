#ifndef PLWCODEBLOCK_H_
#define PLWCODEBLOCK_H_

#include "PlwCommon.h"

typedef struct PlwCodeBlock {
	PlwInt codeCount;
	PlwInt *codes;
	PlwInt strConstCount;
	char **strConsts;
	PlwInt floatConstCount;
	PlwFloat *floatConsts;
	PlwInt entryPoint;
} PlwCodeBlock;

PlwCodeBlock *PlwCodeBlock_Create(PlwError *error);

void PlwCodeBlock_Destroy(PlwCodeBlock *codeBlock);
		
#endif
