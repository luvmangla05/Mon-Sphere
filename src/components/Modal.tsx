import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

export function Modal({
  open,
  isOpen,
  title,
  onClose,
  children,
  actions,
}: {
  open?: boolean;
  isOpen?: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const visible = typeof open === 'boolean' ? open : !!isOpen;
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="relative z-10 w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl"
          >
            {title && <h3 className="text-xl font-semibold mb-4">{title}</h3>}
            <div className="space-y-4">{children}</div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              {actions}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
