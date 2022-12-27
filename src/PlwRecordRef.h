#ifndef PLWRECORDREF_H_
#define PLWRECORDREF_H_

#include "PlwRefManager.h"

extern const char * const PlwRecordRefTagName;
struct PlwRecordRef;
typedef struct PlwRecordRef PlwRecordRef;

PlwRefId PlwRecordRef_Make(PlwRefManager *refMan, PlwInt refSize, PlwInt totalSize, PlwInt *ptr, PlwError *error);

PlwInt PlwRecordRef_RefSize(PlwRecordRef *ref);

PlwInt PlwRecordRef_TotalSize(PlwRecordRef *ref);

PlwInt *PlwRecordRef_Ptr(PlwRecordRef *ref);

void PlwRecordRef_SetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwInt value, PlwError *error);

void PlwRecordRef_GetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwBoolean isForMutate, PlwError *error, PlwOffsetValue *result);

PlwRefId PlwRecordRef_ShallowCopy(PlwRefManager *refMan, void *ref, PlwError *error);

PlwBoolean PlwRecordRef_CompareTo(PlwRefManager *refMan, void *ref1, void *ref2, PlwError *error);

void PlwRecordRef_Destroy(PlwRefManager *refMan, void *ref, PlwError *error);

void PlwRecordRef_QuickDestroy(void *ref);

#endif
