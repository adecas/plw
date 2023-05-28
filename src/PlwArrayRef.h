#ifndef PLWARRAYREF_H_
#define PLWARRAYREF_H_

#include "PlwRefManager.h"

extern const char * const PlwArrayRefTagName;
struct PlwArrayRef;
typedef struct PlwArrayRef PlwArrayRef;

PlwRefId PlwArrayRef_Make(PlwRefManager *refMan, PlwInt size, PlwRefId *ptr, PlwError *error);

PlwInt PlwArrayRef_Size(PlwArrayRef *ref);

void PlwArrayRef_SetSize(PlwArrayRef *ref, PlwInt size);

PlwRefId *PlwArrayRef_Ptr(PlwArrayRef *ref);

void PlwArrayRef_SetPtr(PlwArrayRef *ref, PlwRefId *ptr);

void PlwArrayRef_SetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwInt value, PlwError *error);

void PlwArrayRef_GetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwBoolean isForMutate, PlwError *error, PlwOffsetValue *result);

PlwRefId PlwArrayRef_ShallowCopy(PlwRefManager *refMan, void *ref, PlwError *error);

PlwBoolean PlwArrayRef_CompareTo(PlwRefManager *refMan, void *ref1, void *ref2, PlwError *error);

void PlwArrayRef_Destroy(PlwRefManager *refMan, void *ref, PlwError *error);

void PlwArrayRef_QuickDestroy(void *ref);

#endif
