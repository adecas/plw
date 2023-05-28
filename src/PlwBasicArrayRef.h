#ifndef PLWBASICARRAYREF_H_
#define PLWBASICARRAYREF_H_

#include "PlwRefManager.h"

extern const char * const PlwBasicArrayRefTagName;
struct PlwBasicArrayRef;
typedef struct PlwBasicArrayRef PlwBasicArrayRef;

PlwRefId PlwBasicArrayRef_Make(PlwRefManager *refMan, PlwInt size, PlwInt *ptr, PlwError *error);

PlwInt PlwBasicArrayRef_Size(PlwBasicArrayRef *ref);

void PlwBasicArrayRef_SetSize(PlwBasicArrayRef *ref, PlwInt size);

PlwInt *PlwBasicArrayRef_Ptr(PlwBasicArrayRef *ref);

void PlwBasicArrayRef_SetPtr(PlwBasicArrayRef *ref, PlwInt *ptr);

void PlwBasicArrayRef_SetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwInt value, PlwError *error);

void PlwBasicArrayRef_GetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwBoolean isForMutate, PlwError *error, PlwOffsetValue *result);

PlwRefId PlwBasicArrayRef_ShallowCopy(PlwRefManager *refMan, void *ref, PlwError *error);

PlwBoolean PlwBasicArrayRef_CompareTo(PlwRefManager *refMan, void *ref1, void *ref2, PlwError *error);

void PlwBasicArrayRef_Destroy(PlwRefManager *refMan, void *ref, PlwError *error);

void PlwBasicArrayRef_QuickDestroy(void *ref);

#endif
