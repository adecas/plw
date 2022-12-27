#ifndef PLWREFMANAGER_H_
#define PLWREFMANAGER_H_

#include "PlwCommon.h"

typedef PlwInt PlwRefId ;

typedef struct PlwOffsetValue {
	PlwInt value;
	PlwBoolean isRef;
} PlwOffsetValue;

extern const char * const PlwRefManErrorInvalidRefId;
extern const char * const PlwRefManErrorInvalidRefType;
extern const char * const PlwRefManErrorInvalidOffset;
extern const char * const PlwRefManErrorInvalidOperation;

void PlwRefManError_InvalidOffset(PlwError *error, PlwInt offset);
void PlwRefManError_InvalidOperation(PlwError *error, const char *refType, const char *operation);


struct PlwRefManagerStruct;
typedef struct PlwRefManagerStruct PlwRefManager;

PlwRefManager *PlwRefManager_Create(PlwError *error);

void PlwRefManager_Destroy(PlwRefManager *refMan);

PlwInt PlwRefManager_RefCount(PlwRefManager *refMan);

PlwRefId PlwRefManager_AddRef(PlwRefManager *refMan, void *ref, PlwError *error);

void *PlwRefManager_GetRef(PlwRefManager *refMan, PlwRefId refId, PlwError *error);

void *PlwRefManager_GetRefOfType(PlwRefManager *refMan, PlwRefId refId, const char *refType, PlwError *error);

void PlwRefManager_IncRefCount(PlwRefManager *refMan, PlwRefId refId, PlwError *error);

void PlwRefManager_AddRefCount(PlwRefManager *refMan, PlwRefId refId, PlwInt count, PlwError *error);

void PlwRefManager_DecRefCount(PlwRefManager *refMan, PlwRefId refId, PlwError *error);

PlwBoolean PlwRefManager_CompareRefs(PlwRefManager *refMan, PlwRefId refId1, PlwRefId refId2, PlwError *error);

PlwRefId PlwRefManager_MakeMutable(PlwRefManager *refMan, PlwRefId refId, PlwError *error);

void PlwRefManager_GetOffsetValue(PlwRefManager *refMan, PlwRefId refId, PlwInt offset, PlwBoolean isForMutate, PlwError *error, PlwOffsetValue *result);

void PlwRefManager_SetOffsetValue(PlwRefManager *refMan, PlwRefId refId, PlwInt offset, PlwInt val, PlwError *error);

#endif
