#include "PlwCodeBlock.h"
#include "PlwCommon.h"

void PlwCodeBlock_Init(PlwCodeBlock *cb, char *name) {
	cb->name = name;
	cb->codeCount = 0;
	cb->codes = NULL;
	cb->strConstCount = 0;
	cb->strConsts = NULL;
}

