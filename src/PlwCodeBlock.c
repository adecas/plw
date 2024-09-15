#include "PlwCodeBlock.h"
#include "PlwCommon.h"

PlwCodeBlock *PlwCodeBlock_Create(PlwError *error) {
	PlwCodeBlock *cb;
	cb = PlwAlloc(sizeof(PlwCodeBlock), error);
	if (PlwIsError(error)) {
		return NULL;
	}
	cb->codeCount = 0;
	cb->codes = NULL;
	cb->strConstCount = 0;
	cb->strConsts = NULL;
	cb->floatConstCount = 0;
	cb->floatConsts = NULL;
	return cb;
}

void PlwCodeBlock_Destroy(PlwCodeBlock *cb) {
	PlwInt i;
	for (i = 0; i < cb->strConstCount; i++) {
		PlwFree(cb->strConsts[i]);
	}
	PlwFree(cb->strConsts);
	PlwFree(cb->floatConsts);
	PlwFree(cb);
}


