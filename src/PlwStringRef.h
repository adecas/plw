#ifndef PLWSTRINGREF_H_
#define PLWSTRINGREF_H_

#include "PlwRefManager.h"

extern const char * const PlwStringRefTagName;
struct PlwStringRef;
typedef struct PlwStringRef PlwStringRef;

PlwRefId PlwStringRef_Make(PlwRefManager *refMan, char *ptr, PlwError *error);

char *PlwStringRef_Ptr(PlwStringRef *ref);

void PlwStringRef_SetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwInt value, PlwError *error);

void PlwStringRef_GetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwBoolean isForMutate, PlwError *error, PlwOffsetValue *result);

PlwRefId PlwStringRef_ShallowCopy(PlwRefManager *refMan, void *ref, PlwError *error);

PlwBoolean PlwStringRef_CompareTo(PlwRefManager *refMan, void *ref1, void *ref2, PlwError *error);

void PlwStringRef_Destroy(PlwRefManager *refMan, void *ref, PlwError *error);

void PlwStringRef_QuickDestroy(void *ref);

#endif
