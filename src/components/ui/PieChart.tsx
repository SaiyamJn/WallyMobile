import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  size?: number;
  showLegend?: boolean;
  innerRadius?: number;
  formatCurrency?: (amount: number) => string;
}

// Simple currency formatter - default fallback
const defaultFormatCurrency = (amount: number, currencyCode: string = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function PieChart({ 
  data, 
  size = 180, 
  showLegend = true,
  innerRadius = 0,
  formatCurrency: formatCurrencyProp
}: PieChartProps) {
  const formatCurrencyFn = formatCurrencyProp || defaultFormatCurrency;
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Text style={styles.emptyText}>No data</Text>
      </View>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Text style={styles.emptyText}>No data</Text>
      </View>
    );
  }

  const center = size / 2;
  const radius = (size - 20) / 2;
  const effectiveRadius = radius - (innerRadius > 0 ? innerRadius : 0);

  let currentAngle = -90; // Start from top
  const paths: JSX.Element[] = [];
  const legendItems: JSX.Element[] = [];

  data.forEach((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    // Calculate path for this segment
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;

    const x1 = center + effectiveRadius * Math.cos(startAngleRad);
    const y1 = center + effectiveRadius * Math.sin(startAngleRad);
    const x2 = center + effectiveRadius * Math.cos(endAngleRad);
    const y2 = center + effectiveRadius * Math.sin(endAngleRad);

    const largeArcFlag = angle > 180 ? 1 : 0;

    let pathData = '';
    if (innerRadius > 0) {
      // Donut chart
      const innerX1 = center + innerRadius * Math.cos(startAngleRad);
      const innerY1 = center + innerRadius * Math.sin(startAngleRad);
      const innerX2 = center + innerRadius * Math.cos(endAngleRad);
      const innerY2 = center + innerRadius * Math.sin(endAngleRad);

      // Create donut segment path
      pathData = [
        `M ${x1.toFixed(2)} ${y1.toFixed(2)}`,
        `A ${effectiveRadius.toFixed(2)} ${effectiveRadius.toFixed(2)} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
        `L ${innerX2.toFixed(2)} ${innerY2.toFixed(2)}`,
        `A ${innerRadius.toFixed(2)} ${innerRadius.toFixed(2)} 0 ${largeArcFlag} 0 ${innerX1.toFixed(2)} ${innerY1.toFixed(2)}`,
        'Z'
      ].join(' ');
    } else {
      // Full pie chart
      pathData = [
        `M ${center.toFixed(2)} ${center.toFixed(2)}`,
        `L ${x1.toFixed(2)} ${y1.toFixed(2)}`,
        `A ${effectiveRadius.toFixed(2)} ${effectiveRadius.toFixed(2)} 0 ${largeArcFlag} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`,
        'Z'
      ].join(' ');
    }

    paths.push(
      <Path
        key={index}
        d={pathData}
        fill={item.color || '#9ca3af'}
        stroke="#1a1a1a"
        strokeWidth={1}
      />
    );

    if (showLegend) {
      legendItems.push(
        <View key={index} style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: item.color }]} />
          <View style={styles.legendText}>
            <Text style={styles.legendLabel} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.legendValue}>
              {formatCurrencyFn(item.value)} ({(percentage * 100).toFixed(1)}%)
            </Text>
          </View>
        </View>
      );
    }

    currentAngle = endAngle;
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.chartContainer}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G>
            {paths}
          </G>
        </Svg>
      </View>
      {showLegend && (
        <View style={styles.legend}>
          {legendItems}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: '100%',
  },
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 12,
  },
  legend: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingRight: 10,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendText: {
    flex: 1,
  },
  legendLabel: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
    marginBottom: 2,
  },
  legendValue: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
