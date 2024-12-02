(module (memory $memory 1)
	
;;==========================================================================================================================================
;;
;; Allocator for the memory
;;
;; Layout:
;;   0  Reserved for null pointer
;;   8  FirstBlock
;;
;;             0      4      8          12         16
;; Free Block: <size> <prev> <prevFree> <nextFree> <padding>
;; Used block: <size> <prev> <maxInt32> <padding>  <payload>
;;
;;==========================================================================================================================================

(global $MEM_firstFreeBlock (mut i32) (i32.const 8))
(global $MEM_lastBlock (mut i32) (i32.const 8))

(func $MEM_align8 (param i32) (result i32) (i32.and (i32.add (i32.const 7) (local.get 0)) (i32.const 0xFFFFFFF8)))
(func $MEM_getBlockHeaderSize (result i32) (i32.const 16))
(func $MEM_getBlockSize (param $block i32) (result i32) (i32.load (local.get $block)))
(func $MEM_setBlockSize (param $block i32) (param $size i32) (i32.store (local.get $block) (local.get $size)))
(func $MEM_getBlockPrev (param $block i32) (result i32) (i32.load offset=4 (local.get $block)))
(func $MEM_setBlockPrev (param $block i32) (param $prev i32) (i32.store offset=4 (local.get $block) (local.get $prev)))
(func $MEM_getBlockPrevFree (param $block i32) (result i32) (i32.load offset=8 (local.get $block)))
(func $MEM_setBlockPrevFree (param $block i32) (param $prevFree i32) (i32.store offset=8 (local.get $block) (i32.const 8) (local.get $prevFree)))
(func $MEM_getBlockNextFree (param $block i32) (result i32) (i32.load offset=12 (local.get $block) (i32.const 12)))
(func $MEM_setBlockNextFree (param $block i32) (param $prevFree i32) (i32.store offset=12 (local.get $block) (local.get $prevFree)))
(func $MEM_isBlockUsed (param $block i32) (result i32) (i32.eq (call $MEM_getBlockPrevFree (local.get $block)) (i32.const 0xFFFFFFFF)))
(func $MEM_setBlockUsed (param $block i32) (call $MEM_setBlockPrevFree (local.get $block) (i32.const 0xFFFFFFFF)))

(func $MEM_init (param $firstFreeBlock i32)
	(global.set $MEM_firstFreeBlock (local.get $firstFreeBlock))
	(global.set $MEM_lastBlock (local.get $firstFreeBlock))
	(call $MEM_setBlockSize
		(global.get $MEM_firstFreeBlock)
		(i32.sub (i32.mul (memory.size) (i32.const 65536)) (global.get $MEM_firstFreeBlock)))
	(call $MEM_setBlockPrev (global.get $MEM_firstFreeBlock) (i32.const 0))
	(call $MEM_setBlockPrevFree (global.get $MEM_firstFreeBlock) (i32.const 0))
	(call $MEM_setBlockNextFree (global.get $MEM_firstFreeBlock) (i32.const 0)))

(func $MEM_findFreeBlock (param $size i32) (result i32)
	(local $blockSize i32)
	(local $block i32)
	(local.set $blockSize (i32.add (local.get $size) (call $MEM_getBlockHeaderSize)))
	(local.set $block (global.get $MEM_firstFreeBlock))
	(block $exitNextBlock
		(if (i32.eqz (local.get $block))
			(then (br $exitNextBlock)))
		(if (i32.le_u (local.get $blockSize) (call $MEM_getBlockSize (local.get $block)))	
			(then (br $exitNextBlock)))
		(local.set $block (call $MEM_getBlockNextFree (local.get $block))))		
	(local.get $block))
	
(func $MEM_alloc (param $size i32) (result i32)
	(local $block i32)
	(local $blockSize i32)
	(local $prevFree i32)
	(local $nextFree i32)
	(local $newBlock i32)
	(local $nextBlock i32)
	(local $payload i32)
	(if (i32.eqz (local.get $size))
		(then (return (i32.const 0))))
	(local.set $size (call $MEM_align8 (local.get $size)))
	(local.set $block (call $MEM_findFreeBlock (local.get $size)))
	(if (i32.eqz (local.get $block))
		(then (unreachable)))
	(local.set $blockSize (call $MEM_getBlockSize (local.get $block)))
	(local.set $prevFree (call $MEM_getBlockPrevFree (local.get $block)))
	(local.set $nextFree (call $MEM_getBlockNextFree (local.get $block)))
	(call $MEM_setBlockUsed (local.get $block))
	(if (i32.gt_s (local.get $blockSize) (i32.add (local.get $size) (i32.mul (call $MEM_getBlockHeaderSize) (i32.const 4))))
		(then
			(call $MEM_setBlockSize (local.get $block) (i32.add (local.get $size) (call $MEM_getBlockHeaderSize)))
			(local.set $newBlock (i32.add (local.get $block) (call $MEM_getBlockSize (local.get $block))))
			(call $MEM_setBlockSize (local.get $newBlock) (i32.sub (local.get $blockSize) (call $MEM_getBlockSize (local.get $block))))
			(call $MEM_setBlockPrev (local.get $newBlock) (local.get $block))
			(call $MEM_setBlockPrevFree (local.get $newBlock) (local.get $prevFree))
			(call $MEM_setBlockNextFree (local.get $newBlock) (local.get $nextFree))
			(if (i32.eqz (local.get $prevFree))
				(then (global.set $MEM_firstFreeBlock (local.get $newBlock)))
				(else (call $MEM_setBlockNextFree (local.get $prevFree) (local.get $newBlock))))
			(if (i32.ne (local.get $nextFree) (i32.const 0))
				(then (call $MEM_setBlockPrevFree (local.get $nextFree) (local.get $newBlock))))
			(if (i32.eq (local.get $block) (global.get $MEM_lastBlock))
				(then
					(global.set $MEM_lastBlock (local.get $newBlock)))
				(else
					(local.set $nextBlock (i32.add (local.get $block) (local.get $blockSize)))
					(call $MEM_setBlockPrev (local.get $nextBlock) (local.get $newBlock)))))
		(else
			(if (i32.eqz (local.get $prevFree))
				(then (global.set $MEM_firstFreeBlock (local.get $nextFree)))
				(else (call $MEM_setBlockNextFree (local.get $prevFree) (local.get $nextFree))))
			(if (i32.gt_s (local.get $nextFree) (i32.const 0))
				(then (call $MEM_setBlockPrevFree (local.get $nextFree) (local.get $prevFree))))))
	(i32.add (local.get $block) (call $MEM_getBlockHeaderSize)))
	
(func $MEM_free (param $ptr i32)
	(local $block i32)
	(local $blockSize i32)
	(local $prevBlock i32)
	(local $isPrevBlockFree i32)
	(local $nextBlock i32)
	(local $isNextBlockFree i32)
	(local $nextBlockSize i32)
	(local $nextNextBlock i32)
	(local $prevFreeBlock i32)
	(local $nextFreeBlock i32)
	(local.set $block (i32.sub (local.get $ptr) (call $MEM_getBlockHeaderSize)))
	(local.set $blockSize (call $MEM_getBlockSize (local.get $block)))
	(local.set $prevBlock (call $MEM_getBlockPrev (local.get $block)))
	(local.set $isPrevBlockFree (i32.const 0))
	(if (i32.ne (local.get $prevBlock) (i32.const 0))
		(then
			(if (i32.eqz (call $MEM_isBlockUsed (local.get $prevBlock)))
				(then (local.set $isPrevBlockFree (i32.const 1))))))
	(local.set $nextBlock (i32.add (local.get $block) (local.get $blockSize)))
	(local.set $isNextBlockFree (i32.const 0))
	(if (i32.ne (local.get $nextBlock) (i32.const 0))
		(then
			(if (i32.eqz (call $MEM_isBlockUsed (local.get $nextBlock)))
				(then (local.set $isNextBlockFree (i32.const 1))))))
	(if (local.get $isPrevBlockFree)
		(then
			(if (local.get $isNextBlockFree)
				(then
					(local.set $nextBlockSize (call $MEM_getBlockSize (local.get $nextBlock)))
					(local.set $nextNextBlock (i32.add (local.get $nextBlock) (local.get $nextBlockSize)))
					(call $MEM_setBlockSize
						(local.get $prevBlock)
						(i32.add (call $MEM_getBlockSize (local.get $prevBlock))
							(i32.add (local.get $blockSize) (local.get $nextBlockSize))))
					(if (i32.eq (local.get $nextBlock) (global.get $MEM_lastBlock))
						(then
							(global.set $MEM_lastBlock (local.get $prevBlock)))
						(else
							(call $MEM_setBlockPrev (local.get $nextNextBlock) (local.get $prevBlock))))
					(local.set $prevFreeBlock (call $MEM_getBlockPrevFree (local.get $nextBlock)))
					(local.set $nextFreeBlock (call $MEM_getBlockNextFree (local.get $nextBlock)))
					(if (i32.eqz (local.get $prevFreeBlock))
						(then (global.set $MEM_firstFreeBlock (local.get $nextFreeBlock)))
						(else (call $MEM_setBlockNextFree (local.get $prevFreeBlock) (local.get $nextFreeBlock))))
					(if (i32.ne (local.get $nextFreeBlock) (i32.const 0))
						(then (call $MEM_setBlockPrevFree (local.get $nextFreeBlock) (local.get $prevFreeBlock)))))
				(else
					(call $MEM_setBlockSize
						(local.get $prevBlock)
						(i32.add (call $MEM_getBlockSize (local.get $prevBlock)) (local.get $blockSize)))
					(if (i32.eq (local.get $block) (global.get $MEM_lastBlock))
						(then
							(global.set $MEM_lastBlock (local.get $prevBlock)))
						(else
							(call $MEM_setBlockPrev (local.get $nextBlock) (local.get $prevBlock)))))))
		(else
			(if (local.get $isNextBlockFree)
				(then
					(local.set $nextBlockSize (call $MEM_getBlockSize (local.get $nextBlock)))
					(local.set $nextNextBlock (i32.add (local.get $nextBlock) (local.get $nextBlockSize)))
					(local.set $prevFreeBlock (call $MEM_getBlockPrevFree (local.get $nextBlock)))
					(local.set $nextFreeBlock (call $MEM_getBlockNextFree (local.get $nextBlock)))
					(call $MEM_setBlockSize (local.get $block) (i32.add (local.get $blockSize) (local.get $nextBlockSize)))
					(call $MEM_setBlockPrevFree (local.get $block) (local.get $prevFreeBlock))
					(call $MEM_setBlockNextFree (local.get $block) (local.get $nextFreeBlock))
					(if (i32.eq (local.get $nextBlock) (global.get $MEM_lastBlock))
						(then (global.set $MEM_lastBlock (local.get $block)))
						(else (call $MEM_setBlockPrev (local.get $nextNextBlock) (local.get $block))))
					(if (i32.eqz (local.get $prevFreeBlock))
						(then (global.set $MEM_firstFreeBlock (local.get $block)))
						(else (call $MEM_setBlockNextFree (local.get $prevFreeBlock) (local.get $block))))
					(if (i32.ne (local.get $nextFreeBlock) (i32.const 0))
						(then (call $MEM_setBlockPrevFree (local.get $nextFreeBlock) (local.get $block)))))
				(else
					(call $MEM_setBlockPrevFree (local.get $block) (i32.const 0))
					(call $MEM_setBlockNextFree (local.get $block) (global.get $MEM_firstFreeBlock))
					(if (i32.ne (global.get $MEM_firstFreeBlock) (i32.const 0))
						(call $MEM_setBlockPrevFree (global.get $MEM_firstFreeBlock) (local.get $block)))
					(global.set $MEM_firstFreeBlock (local.get $block)))))))
					
(func $REF_create (param $size i32) (result i32)
	(local $ptr i32)
	(local.set $ptr (call $MEM_alloc (i32.add (local.get $size) (i32.const 4))))
	(i32.store (local.get $ptr) (i32.const 1))
	(i32.add (local.get $ptr) (i32.const 4)))
	
(func $REF_incRc (param $ptr i32) (result i32)
	(local $countPtr i32)
	(local.set $countPtr (i32.sub (local.get $ptr) (i32.const 4)))
	(i32.store (local.get $countPtr) (i32.add (i32.load (local.get $countPtr)) (i32.const 1)))
	(local.get $ptr))

(func $REF_decRc (param $ptr i32) (result i32)
	(local $countPtr i32)
	(local $count i32)
	(local.set $countPtr (i32.sub (local.get $ptr) (i32.const 4)))
	(local.set $count (i32.sub (i32.load (local.get $countPtr)) (i32.const 1)))
	(i32.store (local.get $countPtr) (local.get $count))
	(local.get $count))
	
(func $REF_destroy (param $ptr i32)
	(call $MEM_free (i32.sub (local.get $ptr) (i32.const 4))))
	
(export "memory" (memory $memory))
(export "MEM_firstFreeBlock" (global $MEM_firstFreeBlock))
(export "MEM_lastBlock" (global $MEM_lastBlock))
(export "MEM_init" (func $MEM_init))
(export "MEM_alloc" (func $MEM_alloc))
(export "MEM_free" (func $MEM_free))
(export "REF_create" (func $REF_create))
(export "REF_incRc" (func $REF_incRc))
(export "REF_decRc" (func $REF_decRc))
(export "REF_destroy" (func $REF_destroy))

) ;; end module
