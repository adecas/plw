#ifndef PLWMAPPEDRECORDREF_H_
#define PLWMAPPEDRECORDREF_H_

#include "PlwRefManager.h"

extern const char * const PlwMappedRecordRefTagName;
struct PlwMappedRecordRef;
typedef struct PlwMappedRecordRef PlwMappedRecordRef;

PlwRefId PlwMappedRecordRef_Make(PlwRefManager *refMan, PlwInt size, PlwInt *ptr, PlwBoolean *mapPtr, PlwError *error);

void PlwMappedRecordRef_Resize(PlwMappedRecordRef *ref, PlwInt newSize, PlwError *error);

PlwInt PlwMappedRecordRef_Size(PlwMappedRecordRef *ref);

PlwInt *PlwMappedRecordRef_Ptr(PlwMappedRecordRef *ref);

PlwBoolean *PlwMappedRecordRef_MapPtr(PlwMappedRecordRef *ref);

void PlwMappedRecordRef_SetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwInt value, PlwError *error);

void PlwMappedRecordRef_GetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwBoolean isForMutate, PlwError *error, PlwOffsetValue *result);

PlwRefId PlwMappedRecordRef_ShallowCopy(PlwRefManager *refMan, void *ref, PlwError *error);

PlwBoolean PlwMappedRecordRef_CompareTo(PlwRefManager *refMan, void *ref1, void *ref2, PlwError *error);

void PlwMappedRecordRef_Destroy(PlwRefManager *refMan, void *ref, PlwError *error);

void PlwMappedRecordRef_QuickDestroy(void *ref);

#endif
