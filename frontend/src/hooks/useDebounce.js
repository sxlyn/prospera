import { useState, useEffect } from 'react';

/**
 * useDebounce — Hook debounce generik (enterprise pattern)
 * HIGH-07: Mencegah filtering/API-call berlebihan saat user mengetik.
 *
 * Cara kerja:
 *   - Setiap kali `value` berubah, timer 300ms direset.
 *   - `debouncedValue` hanya berubah setelah user berhenti mengetik selama `delay` ms.
 *   - Cleanup otomatis via useEffect return — tidak ada memory leak.
 *
 * @param {any} value - Nilai yang ingin di-debounce (biasanya string input)
 * @param {number} delay - Delay dalam ms (default: 300ms — standar UX industri)
 * @returns {any} debouncedValue - Nilai yang sudah di-debounce
 *
 * @example
 *   const debouncedSearch = useDebounce(searchTerm, 300);
 *   const filtered = products.filter(p => p.name.includes(debouncedSearch));
 */
const useDebounce = (value, delay = 300) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Set timer untuk update debouncedValue setelah `delay` ms
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Cleanup: batalkan timer lama setiap kali value berubah
        // Ini yang membuat debounce bekerja — timer hanya selesai jika user berhenti mengetik
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
};

export default useDebounce;
