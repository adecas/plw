#ifndef PLWBLOBREF_H_
#define PLWBLOBREF_H_

#include "PlwRefManager.h"

extern const char * const PlwBlobRefTagName;
struct PlwBlobdRef;
typedef struct PlwBlobRef PlwBlobRef;

PlwRefId PlwBlobRef_Make(PlwRefManager *refMan, PlwInt size, PlwInt *ptr, PlwBoolean *mapPtr, PlwError *error);

void PlwBlobRef_Resize(PlwBlobRef *ref, PlwInt newSize, PlwError *error);

PlwInt PlwBlobRef_Size(PlwBlobRef *ref);

PlwInt *PlwBlobRef_Ptr(PlwBlobRef *ref);

PlwBoolean *PlwBlobRef_MapPtr(PlwBlobRef *ref);

PlwRefId PlwBlobRef_ShallowCopy(PlwRefManager *refMan, void *ref, PlwError *error);

PlwBoolean PlwBlobRef_CompareTo(PlwRefManager *refMan, void *ref1, void *ref2, PlwError *error);

void PlwBlobRef_Destroy(PlwRefManager *refMan, void *ref, PlwError *error);

void PlwBlobRef_QuickDestroy(void *ref);

#endif
