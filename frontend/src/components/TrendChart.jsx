import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatRupiah } from '../utils/format';
import { useTheme } from '../hooks/useTheme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function TrendChart({ labels, sales, profit, salesLabel = 'Penjualan Kotor', profitLabel = 'Laba Bersih' }) {
    const { activeTheme } = useTheme();
    const isDark = activeTheme === 'dark';

    const data = {
        labels,
        datasets: [
            {
                label: salesLabel,
                data: sales,
                borderColor: '#2563EB',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                fill: true,
                tension: 0.4,
            },
            {
                label: profitLabel,
                data: profit,
                borderColor: '#10B981',
                backgroundColor: 'transparent',
                tension: 0.4,
            },
        ],
    };

    const textColor = isDark ? '#dee2e6' : '#6c757d'; // Bootstrap gray-200 or gray-600
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    return (
        <Line
            data={data}
            options={{
                responsive: true,
                maintainAspectRatio: false,
                color: textColor, // Legend text color
                plugins: {
                    legend: {
                        labels: {
                            color: textColor
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${formatRupiah(context.raw)}`,
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor, drawBorder: false }
                    },
                    y: {
                        ticks: { color: textColor },
                        grid: { color: gridColor, drawBorder: false }
                    }
                }
            }}
        />
    );
}

export default TrendChart;
