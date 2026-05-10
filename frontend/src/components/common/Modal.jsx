import { AnimatePresence, motion } from 'framer-motion';
import { MdClose } from 'react-icons/md';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const maxW = size === 'lg' ? 'max-w-3xl' : size === 'sm' ? 'max-w-sm' : 'max-w-xl';
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="modal-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`modal-content ${maxW}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h3 className="font-bold text-xl text-white">{title}</h3>
            <button onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition-colors">
              <MdClose size={20} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
