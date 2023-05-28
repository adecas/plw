#ifndef PLWABSRACTREF_H_
#define PLWABSRACTREF_H_

#include "PlwCommon.h"
#include "PlwRefManager.h"

typedef struct PlwAbstractRefTag {
	const char *name;
	void (*SetOffsetValue)(PlwRefManager *refMan, void *ref, PlwInt offset, PlwInt value, PlwError *error);
	void (*GetOffsetValue)(PlwRefManager *refMan, void *ref, PlwInt offset, PlwBoolean isForMutate, PlwError *error, PlwOffsetValue *result);
	PlwRefId (*ShallowCopy)(PlwRefManager *refMan, void *ref, PlwError *error);
	PlwBoolean (*CompareTo)(PlwRefManager *refMan, void *ref1, void *ref2, PlwError *error);
	void (*Destroy)(PlwRefManager *refMan, void *ref, PlwError *error);
	void (*QuickDestroy)(void *ref);
} PlwAbstractRefTag;

typedef struct PlwAbstractRef {
	const PlwAbstractRefTag *tag;
	PlwInt refCount;
} PlwAbstractRef;

#define AsPlwAbstractRef(p) ((PlwAbstractRef *)(p))

void PlwAbstractRef_SetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwInt value, PlwError *error);

void PlwAbstractRef_GetOffsetValue(PlwRefManager *refMan, void *ref, PlwInt offset, PlwBoolean isForMutate, PlwError *error, PlwOffsetValue *result);

PlwRefId PlwAbstractRef_ShallowCopy(PlwRefManager *refMan, void *ref, PlwError *error);

PlwBoolean PlwAbstractRef_CompareTo(PlwRefManager *refMan, void *ref1, void *ref2, PlwError *error);

void PlwAbstractRef_Destroy(PlwRefManager *refMan, void *ref, PlwError *error);

void PlwAbstractRef_QuickDestroy(void *ref);

#endif
