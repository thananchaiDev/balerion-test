import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RotateCcw, X } from 'lucide-react-native';

import { Select } from './Select';
import { initialFilter, type FilterState } from '../utils/filterState';
import { theme } from '../theme';

interface Props {
  open: boolean;
  onClose: () => void;
  value: FilterState;
  onChange: (next: FilterState) => void;
  customerOptions: string[];
  warehouseOptions: string[];
  supplierOptions: string[];
  matchCount: number;
  totalCount: number;
}

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'All Types' },
  { value: 'EMERGENCY', label: 'EMERGENCY' },
  { value: 'OVER_DUE', label: 'OVER_DUE' },
  { value: 'DAILY', label: 'DAILY' },
];

const ALL = '__ALL__';
const SCREEN_HEIGHT = Dimensions.get('window').height;

const toOptions = (label: string, items: string[]) => [
  { value: ALL, label },
  ...items.map((v) => ({ value: v, label: v })),
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-5">
      <Text className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
        {label}
      </Text>
      {children}
    </View>
  );
}

export function Filters({
  open,
  onClose,
  value,
  onChange,
  customerOptions,
  warehouseOptions,
  supplierOptions,
  matchCount,
  totalCount,
}: Props) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(open);
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (open) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slide, {
          toValue: 0,
          damping: 22,
          stiffness: 220,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: SCREEN_HEIGHT,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [open, fade, slide]);

  const update = (patch: Partial<FilterState>) =>
    onChange({ ...value, ...patch });

  return (
    <Modal
      visible={mounted}
      animationType="none"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1">
        <Animated.View
          style={{
            ...StyleSheetAbsoluteFill,
            backgroundColor: theme.colors.modal.scrim,
            opacity: fade,
          }}
        >
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <Animated.View
            style={{
              transform: [{ translateY: slide }],
              maxHeight: '90%',
            }}
            className="bg-white rounded-t-3xl"
          >
            <View className="items-center pt-3 pb-2">
              <View className="h-1 w-10 rounded-full bg-slate-300" />
            </View>

            <View className="flex-row items-center justify-between px-5 pb-3 border-b border-slate-200">
              <Text className="text-lg font-semibold text-slate-900">Filters</Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <X size={24} color={theme.colors.text.primary} />
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 20,
                paddingTop: 20,
                paddingBottom: 16,
              }}
              keyboardShouldPersistTaps="handled"
            >
              <Field label="Type">
                <Select
                  title="Type"
                  value={value.type}
                  options={TYPE_OPTIONS}
                  onChange={(v) => update({ type: v as FilterState['type'] })}
                />
              </Field>

              <Field label="Customer">
                <Select
                  title="Customer"
                  placeholder="All Customers"
                  value={value.customerId || ALL}
                  options={toOptions('All Customers', customerOptions)}
                  onChange={(v) => update({ customerId: v === ALL ? '' : v })}
                />
              </Field>

              <Field label="Warehouse">
                <Select
                  title="Warehouse"
                  placeholder="All Warehouses"
                  value={value.warehouseId || ALL}
                  options={toOptions('All Warehouses', warehouseOptions)}
                  onChange={(v) => update({ warehouseId: v === ALL ? '' : v })}
                />
              </Field>

              <Field label="Supplier">
                <Select
                  title="Supplier"
                  placeholder="All Suppliers"
                  value={value.supplierId || ALL}
                  options={toOptions('All Suppliers', supplierOptions)}
                  onChange={(v) => update({ supplierId: v === ALL ? '' : v })}
                />
              </Field>

              <View className="mt-2 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200">
                <Text className="text-xs text-slate-500">
                  Showing{' '}
                  <Text className="font-semibold text-slate-900">
                    {matchCount.toLocaleString()}
                  </Text>{' '}
                  of {totalCount.toLocaleString()} sub-orders
                </Text>
              </View>
            </ScrollView>

            <View
              className="flex-row gap-3 px-5 pt-4 border-t border-slate-200 bg-white"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              <Pressable
                onPress={() => onChange({ ...initialFilter, search: value.search })}
                className="flex-row items-center justify-center px-5 h-12 rounded-lg border border-slate-300"
              >
                <RotateCcw size={16} color={theme.colors.text.primary} />
                <Text className="text-sm font-semibold text-slate-900 ml-2">
                  Reset
                </Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                className="flex-1 h-12 rounded-lg bg-slate-900 items-center justify-center"
              >
                <Text className="text-sm font-semibold text-white">
                  Apply ({matchCount.toLocaleString()})
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const StyleSheetAbsoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

export function countActiveFilters(value: FilterState): number {
  let n = 0;
  if (value.type !== 'ALL') n++;
  if (value.customerId) n++;
  if (value.warehouseId) n++;
  if (value.supplierId) n++;
  return n;
}
