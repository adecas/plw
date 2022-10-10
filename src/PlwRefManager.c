#define PLW_TAG_REF_EXCEPTION_HANDLER 1
#define PLW_TAG_REF_OBJECT            2
#define PLW_TAG_REF_FRAME             3
#define PLW_TAG_REF_STRING            4
#define PLW_TAG_REF_PRIMARRAY         5

typedef struct PLW_CountedRef_Struct {
	int tag;
	int refCount;
} PLW_CountedRef;

typedef struct PLW_CountedRefExceptionHandler_Struct {
	PLW_CountedRef countedRef;
	int codeBlockId;
	int ip;
	int bp;
} PLW_CountedRefExceptionHandler;



