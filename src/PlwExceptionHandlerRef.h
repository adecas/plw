#ifndef PLWEXCEPTIONHANDLERREF_H_
#define PLWEXCEPTIONHANDLERREF_H_

#include "PlwRefManager.h"

extern const char * const PlwExceptionHandlerRefTagName;
struct PlwExceptionHandlerRef;
typedef struct PlwExceptionHandlerRef PlwExceptionHandlerRef;

PlwRefId PlwExceptionHandlerRef_Make(PlwRefManager *refMan, PlwInt codeBlockId, PlwInt ip, PlwInt bp, PlwError *error);

PlwInt PlwExceptionHandlerRef_CodeBlockId(PlwExceptionHandlerRef *ref);

PlwInt PlwExceptionHandlerRef_Ip(PlwExceptionHandlerRef *ref);

PlwInt PlwExceptionHandlerRef_Bp(PlwExceptionHandlerRef *ref);

void PlwExceptionHandlerRef_SetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwInt value, PlwError *error);

void PlwExceptionHandlerRef_GetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwBoolean isForMutate, PlwError *error, PlwOffsetValue *result);

PlwRefId PlwExceptionHandlerRef_ShallowCopy(PlwRefManager *refMan, void *ref, PlwError *error);

PlwBoolean PlwExceptionHandlerRef_CompareTo(PlwRefManager *refMan, void *ref1, void *ref2, PlwError *error);

void PlwExceptionHandlerRef_Destroy(PlwRefManager *refMan, void *ref, PlwError *error);

void PlwExceptionHandlerRef_QuickDestroy(void *ref);

#endif
