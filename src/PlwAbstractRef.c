#include "PlwAbstractRef.h"

PlwRefId PlwAbstractRef_ShallowCopy(PlwRefManager *refMan, void *ref, PlwError *error) {
	PlwAbstractRef *abstractRef = ref;
	return abstractRef->tag->ShallowCopy(refMan, ref, error);	
}

PlwBoolean PlwAbstractRef_CompareTo(PlwRefManager *refMan, void *ref1, void *ref2, PlwError *error) {
	PlwAbstractRef *abstractRef = ref1;
	return abstractRef->tag->CompareTo(refMan, ref1, ref2, error);	
}

void PlwAbstractRef_Destroy(PlwRefManager *refMan, void *ref, PlwError *error) {
	PlwAbstractRef *abstractRef = ref;
	abstractRef->tag->Destroy(refMan, ref, error);	
}

void PlwAbstractRef_QuickDestroy(void *ref) {
	PlwAbstractRef *abstractRef = ref;
	abstractRef->tag->QuickDestroy(ref);
}

