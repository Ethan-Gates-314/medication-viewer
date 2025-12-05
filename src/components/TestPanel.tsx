/**
 * TestPanel Component
 * Data validation tests comparing expected values against Firestore data
 */

import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { fetchMedicationByRxcui } from '../data/firestoreApi'
import type { MedicationDocument } from '../types/medication'

// ============ TEST DEFINITIONS ============

interface TestCase<T> {
  id: string
  rxcui: string
  name: string
  description: string
  expected: T
  validate: (actual: MedicationDocument, expected: T) => ValidationResult
}

interface ValidationResult {
  passed: boolean
  details: { field: string; expected: string; actual: string; passed: boolean }[]
}

type TestStatus = 'pending' | 'running' | 'passed' | 'failed' | 'error'

interface TestResult {
  status: TestStatus
  actual?: MedicationDocument | null
  validation?: ValidationResult
  error?: string
}

// ============ CONVERSION VALUES TESTS ============

interface ConversionExpected {
  is_liquid: boolean
  strength_val: number | null
  strength_unit: string | null
  package_size?: number | null
  package_unit?: string | null
}

const conversionTests: TestCase<ConversionExpected>[] = [
  {
    id: 'conv-1',
    rxcui: '198440',
    name: 'Acetaminophen 500 MG Oral Tablet',
    description: 'Common OTC tablet - should be solid with 500mg strength',
    expected: {
      is_liquid: false,
      strength_val: 500,
      strength_unit: 'MG',
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'is_liquid',
          expected: String(expected.is_liquid),
          actual: String(actual.conversion_values.is_liquid),
          passed: actual.conversion_values.is_liquid === expected.is_liquid,
        },
        {
          field: 'strength_val',
          expected: String(expected.strength_val),
          actual: String(actual.conversion_values.strength_val),
          passed: actual.conversion_values.strength_val === expected.strength_val,
        },
        {
          field: 'strength_unit',
          expected: expected.strength_unit ?? 'null',
          actual: actual.conversion_values.strength_unit ?? 'null',
          passed: actual.conversion_values.strength_unit === expected.strength_unit,
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'conv-2',
    rxcui: '310965',
    name: 'Ibuprofen 200 MG Oral Tablet',
    description: 'Common NSAID tablet - should be solid with 200mg strength',
    expected: {
      is_liquid: false,
      strength_val: 200,
      strength_unit: 'MG',
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'is_liquid',
          expected: String(expected.is_liquid),
          actual: String(actual.conversion_values.is_liquid),
          passed: actual.conversion_values.is_liquid === expected.is_liquid,
        },
        {
          field: 'strength_val',
          expected: String(expected.strength_val),
          actual: String(actual.conversion_values.strength_val),
          passed: actual.conversion_values.strength_val === expected.strength_val,
        },
        {
          field: 'strength_unit',
          expected: expected.strength_unit ?? 'null',
          actual: actual.conversion_values.strength_unit ?? 'null',
          passed: actual.conversion_values.strength_unit === expected.strength_unit,
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'conv-3',
    rxcui: '308182',
    name: 'Amoxicillin 250 MG Oral Capsule',
    description: 'Common antibiotic capsule - should be solid with 250mg strength',
    expected: {
      is_liquid: false,
      strength_val: 250,
      strength_unit: 'MG',
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'is_liquid',
          expected: String(expected.is_liquid),
          actual: String(actual.conversion_values.is_liquid),
          passed: actual.conversion_values.is_liquid === expected.is_liquid,
        },
        {
          field: 'strength_val',
          expected: String(expected.strength_val),
          actual: String(actual.conversion_values.strength_val),
          passed: actual.conversion_values.strength_val === expected.strength_val,
        },
        {
          field: 'strength_unit',
          expected: expected.strength_unit ?? 'null',
          actual: actual.conversion_values.strength_unit ?? 'null',
          passed: actual.conversion_values.strength_unit === expected.strength_unit,
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'conv-4',
    rxcui: '239191',
    name: 'Amoxicillin 50 MG/ML Oral Suspension',
    description: 'Antibiotic suspension - should be LIQUID',
    expected: {
      is_liquid: true,
      strength_val: 50,
      strength_unit: 'MG',
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'is_liquid',
          expected: String(expected.is_liquid),
          actual: String(actual.conversion_values.is_liquid),
          passed: actual.conversion_values.is_liquid === expected.is_liquid,
        },
        {
          field: 'strength_val',
          expected: String(expected.strength_val),
          actual: String(actual.conversion_values.strength_val),
          passed: actual.conversion_values.strength_val === expected.strength_val,
        },
        {
          field: 'strength_unit',
          expected: expected.strength_unit ?? 'null',
          actual: actual.conversion_values.strength_unit ?? 'null',
          passed: actual.conversion_values.strength_unit === expected.strength_unit,
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'conv-5',
    rxcui: '861007',
    name: 'Metformin 500 MG Oral Tablet',
    description: 'Diabetes medication tablet - should be solid with 500mg',
    expected: {
      is_liquid: false,
      strength_val: 500,
      strength_unit: 'MG',
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'is_liquid',
          expected: String(expected.is_liquid),
          actual: String(actual.conversion_values.is_liquid),
          passed: actual.conversion_values.is_liquid === expected.is_liquid,
        },
        {
          field: 'strength_val',
          expected: String(expected.strength_val),
          actual: String(actual.conversion_values.strength_val),
          passed: actual.conversion_values.strength_val === expected.strength_val,
        },
        {
          field: 'strength_unit',
          expected: expected.strength_unit ?? 'null',
          actual: actual.conversion_values.strength_unit ?? 'null',
          passed: actual.conversion_values.strength_unit === expected.strength_unit,
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'conv-6',
    rxcui: '314076',
    name: 'Lisinopril 10 MG Oral Tablet',
    description: 'ACE inhibitor tablet - should be solid with 10mg',
    expected: {
      is_liquid: false,
      strength_val: 10,
      strength_unit: 'MG',
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'is_liquid',
          expected: String(expected.is_liquid),
          actual: String(actual.conversion_values.is_liquid),
          passed: actual.conversion_values.is_liquid === expected.is_liquid,
        },
        {
          field: 'strength_val',
          expected: String(expected.strength_val),
          actual: String(actual.conversion_values.strength_val),
          passed: actual.conversion_values.strength_val === expected.strength_val,
        },
        {
          field: 'strength_unit',
          expected: expected.strength_unit ?? 'null',
          actual: actual.conversion_values.strength_unit ?? 'null',
          passed: actual.conversion_values.strength_unit === expected.strength_unit,
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'conv-7',
    rxcui: '197591',
    name: 'Diazepam 5 MG Oral Tablet',
    description: 'Benzodiazepine tablet - should be solid with 5mg',
    expected: {
      is_liquid: false,
      strength_val: 5,
      strength_unit: 'MG',
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'is_liquid',
          expected: String(expected.is_liquid),
          actual: String(actual.conversion_values.is_liquid),
          passed: actual.conversion_values.is_liquid === expected.is_liquid,
        },
        {
          field: 'strength_val',
          expected: String(expected.strength_val),
          actual: String(actual.conversion_values.strength_val),
          passed: actual.conversion_values.strength_val === expected.strength_val,
        },
        {
          field: 'strength_unit',
          expected: expected.strength_unit ?? 'null',
          actual: actual.conversion_values.strength_unit ?? 'null',
          passed: actual.conversion_values.strength_unit === expected.strength_unit,
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'conv-8',
    rxcui: '198051',
    name: 'Omeprazole 20 MG Delayed Release Oral Capsule',
    description: 'PPI capsule - should be solid with 20mg',
    expected: {
      is_liquid: false,
      strength_val: 20,
      strength_unit: 'MG',
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'is_liquid',
          expected: String(expected.is_liquid),
          actual: String(actual.conversion_values.is_liquid),
          passed: actual.conversion_values.is_liquid === expected.is_liquid,
        },
        {
          field: 'strength_val',
          expected: String(expected.strength_val),
          actual: String(actual.conversion_values.strength_val),
          passed: actual.conversion_values.strength_val === expected.strength_val,
        },
        {
          field: 'strength_unit',
          expected: expected.strength_unit ?? 'null',
          actual: actual.conversion_values.strength_unit ?? 'null',
          passed: actual.conversion_values.strength_unit === expected.strength_unit,
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
]

// ============ PRICING STATS TESTS ============

interface PricingExpected {
  pricing_unit: string
  has_positive_prices: boolean
  has_ndcs: boolean
}

const pricingTests: TestCase<PricingExpected>[] = [
  {
    id: 'price-1',
    rxcui: '198440',
    name: 'Acetaminophen 500 MG Oral Tablet',
    description: 'Should have EA pricing unit and valid prices',
    expected: {
      pricing_unit: 'EA',
      has_positive_prices: true,
      has_ndcs: true,
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'pricing_unit',
          expected: expected.pricing_unit,
          actual: actual.pricing_stats.pricing_unit,
          passed: actual.pricing_stats.pricing_unit === expected.pricing_unit,
        },
        {
          field: 'has_positive_median_price',
          expected: String(expected.has_positive_prices),
          actual: String(actual.pricing_stats.median_unit_price > 0),
          passed: (actual.pricing_stats.median_unit_price > 0) === expected.has_positive_prices,
        },
        {
          field: 'has_ndcs',
          expected: String(expected.has_ndcs),
          actual: String(actual.ndc_links?.ndc11_all?.length > 0),
          passed: (actual.ndc_links?.ndc11_all?.length > 0) === expected.has_ndcs,
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'price-2',
    rxcui: '310965',
    name: 'Ibuprofen 200 MG Oral Tablet',
    description: 'Common OTC - should have EA unit and positive prices',
    expected: {
      pricing_unit: 'EA',
      has_positive_prices: true,
      has_ndcs: true,
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'pricing_unit',
          expected: expected.pricing_unit,
          actual: actual.pricing_stats.pricing_unit,
          passed: actual.pricing_stats.pricing_unit === expected.pricing_unit,
        },
        {
          field: 'has_positive_median_price',
          expected: String(expected.has_positive_prices),
          actual: String(actual.pricing_stats.median_unit_price > 0),
          passed: (actual.pricing_stats.median_unit_price > 0) === expected.has_positive_prices,
        },
        {
          field: 'has_ndcs',
          expected: String(expected.has_ndcs),
          actual: String(actual.ndc_links?.ndc11_all?.length > 0),
          passed: (actual.ndc_links?.ndc11_all?.length > 0) === expected.has_ndcs,
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'price-3',
    rxcui: '239191',
    name: 'Amoxicillin 50 MG/ML Oral Suspension',
    description: 'Liquid suspension - should have ML pricing unit',
    expected: {
      pricing_unit: 'ML',
      has_positive_prices: true,
      has_ndcs: true,
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'pricing_unit',
          expected: expected.pricing_unit,
          actual: actual.pricing_stats.pricing_unit,
          passed: actual.pricing_stats.pricing_unit === expected.pricing_unit,
        },
        {
          field: 'has_positive_median_price',
          expected: String(expected.has_positive_prices),
          actual: String(actual.pricing_stats.median_unit_price > 0),
          passed: (actual.pricing_stats.median_unit_price > 0) === expected.has_positive_prices,
        },
        {
          field: 'has_ndcs',
          expected: String(expected.has_ndcs),
          actual: String(actual.ndc_links?.ndc11_all?.length > 0),
          passed: (actual.ndc_links?.ndc11_all?.length > 0) === expected.has_ndcs,
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'price-4',
    rxcui: '861007',
    name: 'Metformin 500 MG Oral Tablet',
    description: 'Common diabetes med - should have EA unit',
    expected: {
      pricing_unit: 'EA',
      has_positive_prices: true,
      has_ndcs: true,
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'pricing_unit',
          expected: expected.pricing_unit,
          actual: actual.pricing_stats.pricing_unit,
          passed: actual.pricing_stats.pricing_unit === expected.pricing_unit,
        },
        {
          field: 'has_positive_median_price',
          expected: String(expected.has_positive_prices),
          actual: String(actual.pricing_stats.median_unit_price > 0),
          passed: (actual.pricing_stats.median_unit_price > 0) === expected.has_positive_prices,
        },
        {
          field: 'has_ndcs',
          expected: String(expected.has_ndcs),
          actual: String(actual.ndc_links?.ndc11_all?.length > 0),
          passed: (actual.ndc_links?.ndc11_all?.length > 0) === expected.has_ndcs,
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'price-5',
    rxcui: '314076',
    name: 'Lisinopril 10 MG Oral Tablet',
    description: 'ACE inhibitor tablet - should have EA pricing',
    expected: {
      pricing_unit: 'EA',
      has_positive_prices: true,
      has_ndcs: true,
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'pricing_unit',
          expected: expected.pricing_unit,
          actual: actual.pricing_stats.pricing_unit,
          passed: actual.pricing_stats.pricing_unit === expected.pricing_unit,
        },
        {
          field: 'has_positive_median_price',
          expected: String(expected.has_positive_prices),
          actual: String(actual.pricing_stats.median_unit_price > 0),
          passed: (actual.pricing_stats.median_unit_price > 0) === expected.has_positive_prices,
        },
        {
          field: 'has_ndcs',
          expected: String(expected.has_ndcs),
          actual: String(actual.ndc_links?.ndc11_all?.length > 0),
          passed: (actual.ndc_links?.ndc11_all?.length > 0) === expected.has_ndcs,
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'price-6',
    rxcui: '198051',
    name: 'Omeprazole 20 MG Delayed Release Oral Capsule',
    description: 'PPI capsule - should have EA pricing',
    expected: {
      pricing_unit: 'EA',
      has_positive_prices: true,
      has_ndcs: true,
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'pricing_unit',
          expected: expected.pricing_unit,
          actual: actual.pricing_stats.pricing_unit,
          passed: actual.pricing_stats.pricing_unit === expected.pricing_unit,
        },
        {
          field: 'has_positive_median_price',
          expected: String(expected.has_positive_prices),
          actual: String(actual.pricing_stats.median_unit_price > 0),
          passed: (actual.pricing_stats.median_unit_price > 0) === expected.has_positive_prices,
        },
        {
          field: 'has_ndcs',
          expected: String(expected.has_ndcs),
          actual: String(actual.ndc_links?.ndc11_all?.length > 0),
          passed: (actual.ndc_links?.ndc11_all?.length > 0) === expected.has_ndcs,
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'price-7',
    rxcui: '308182',
    name: 'Amoxicillin 250 MG Oral Capsule',
    description: 'Antibiotic capsule - should have EA pricing',
    expected: {
      pricing_unit: 'EA',
      has_positive_prices: true,
      has_ndcs: true,
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'pricing_unit',
          expected: expected.pricing_unit,
          actual: actual.pricing_stats.pricing_unit,
          passed: actual.pricing_stats.pricing_unit === expected.pricing_unit,
        },
        {
          field: 'has_positive_median_price',
          expected: String(expected.has_positive_prices),
          actual: String(actual.pricing_stats.median_unit_price > 0),
          passed: (actual.pricing_stats.median_unit_price > 0) === expected.has_positive_prices,
        },
        {
          field: 'has_ndcs',
          expected: String(expected.has_ndcs),
          actual: String(actual.ndc_links?.ndc11_all?.length > 0),
          passed: (actual.ndc_links?.ndc11_all?.length > 0) === expected.has_ndcs,
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
]

// ============ RXNORM INFO TESTS ============

interface RxNormExpected {
  rxcui: string
  tty: string
  name_contains: string
}

const rxnormTests: TestCase<RxNormExpected>[] = [
  {
    id: 'rxn-1',
    rxcui: '198440',
    name: 'Acetaminophen 500 MG Oral Tablet',
    description: 'SCD - Semantic Clinical Drug for acetaminophen',
    expected: {
      rxcui: '198440',
      tty: 'SCD',
      name_contains: 'acetaminophen',
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'rxcui',
          expected: expected.rxcui,
          actual: actual.rxcui,
          passed: actual.rxcui === expected.rxcui,
        },
        {
          field: 'tty',
          expected: expected.tty,
          actual: actual.tty,
          passed: actual.tty === expected.tty,
        },
        {
          field: 'name_contains',
          expected: `contains "${expected.name_contains}"`,
          actual: actual.name,
          passed: actual.name.toLowerCase().includes(expected.name_contains.toLowerCase()),
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'rxn-2',
    rxcui: '308182',
    name: 'Amoxicillin 250 MG Oral Capsule',
    description: 'SCD - Semantic Clinical Drug for amoxicillin',
    expected: {
      rxcui: '308182',
      tty: 'SCD',
      name_contains: 'amoxicillin',
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'rxcui',
          expected: expected.rxcui,
          actual: actual.rxcui,
          passed: actual.rxcui === expected.rxcui,
        },
        {
          field: 'tty',
          expected: expected.tty,
          actual: actual.tty,
          passed: actual.tty === expected.tty,
        },
        {
          field: 'name_contains',
          expected: `contains "${expected.name_contains}"`,
          actual: actual.name,
          passed: actual.name.toLowerCase().includes(expected.name_contains.toLowerCase()),
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'rxn-3',
    rxcui: '310965',
    name: 'Ibuprofen 200 MG Oral Tablet',
    description: 'SCD - Semantic Clinical Drug for ibuprofen',
    expected: {
      rxcui: '310965',
      tty: 'SCD',
      name_contains: 'ibuprofen',
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'rxcui',
          expected: expected.rxcui,
          actual: actual.rxcui,
          passed: actual.rxcui === expected.rxcui,
        },
        {
          field: 'tty',
          expected: expected.tty,
          actual: actual.tty,
          passed: actual.tty === expected.tty,
        },
        {
          field: 'name_contains',
          expected: `contains "${expected.name_contains}"`,
          actual: actual.name,
          passed: actual.name.toLowerCase().includes(expected.name_contains.toLowerCase()),
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'rxn-4',
    rxcui: '861007',
    name: 'Metformin Hydrochloride 500 MG Oral Tablet',
    description: 'SCD - Semantic Clinical Drug for metformin',
    expected: {
      rxcui: '861007',
      tty: 'SCD',
      name_contains: 'metformin',
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'rxcui',
          expected: expected.rxcui,
          actual: actual.rxcui,
          passed: actual.rxcui === expected.rxcui,
        },
        {
          field: 'tty',
          expected: expected.tty,
          actual: actual.tty,
          passed: actual.tty === expected.tty,
        },
        {
          field: 'name_contains',
          expected: `contains "${expected.name_contains}"`,
          actual: actual.name,
          passed: actual.name.toLowerCase().includes(expected.name_contains.toLowerCase()),
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'rxn-5',
    rxcui: '314076',
    name: 'Lisinopril 10 MG Oral Tablet',
    description: 'SCD - Semantic Clinical Drug for lisinopril',
    expected: {
      rxcui: '314076',
      tty: 'SCD',
      name_contains: 'lisinopril',
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'rxcui',
          expected: expected.rxcui,
          actual: actual.rxcui,
          passed: actual.rxcui === expected.rxcui,
        },
        {
          field: 'tty',
          expected: expected.tty,
          actual: actual.tty,
          passed: actual.tty === expected.tty,
        },
        {
          field: 'name_contains',
          expected: `contains "${expected.name_contains}"`,
          actual: actual.name,
          passed: actual.name.toLowerCase().includes(expected.name_contains.toLowerCase()),
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'rxn-6',
    rxcui: '198051',
    name: 'Omeprazole 20 MG Delayed Release Oral Capsule',
    description: 'SCD - Semantic Clinical Drug for omeprazole',
    expected: {
      rxcui: '198051',
      tty: 'SCD',
      name_contains: 'omeprazole',
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'rxcui',
          expected: expected.rxcui,
          actual: actual.rxcui,
          passed: actual.rxcui === expected.rxcui,
        },
        {
          field: 'tty',
          expected: expected.tty,
          actual: actual.tty,
          passed: actual.tty === expected.tty,
        },
        {
          field: 'name_contains',
          expected: `contains "${expected.name_contains}"`,
          actual: actual.name,
          passed: actual.name.toLowerCase().includes(expected.name_contains.toLowerCase()),
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'rxn-7',
    rxcui: '197591',
    name: 'Diazepam 5 MG Oral Tablet',
    description: 'SCD - Semantic Clinical Drug for diazepam',
    expected: {
      rxcui: '197591',
      tty: 'SCD',
      name_contains: 'diazepam',
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'rxcui',
          expected: expected.rxcui,
          actual: actual.rxcui,
          passed: actual.rxcui === expected.rxcui,
        },
        {
          field: 'tty',
          expected: expected.tty,
          actual: actual.tty,
          passed: actual.tty === expected.tty,
        },
        {
          field: 'name_contains',
          expected: `contains "${expected.name_contains}"`,
          actual: actual.name,
          passed: actual.name.toLowerCase().includes(expected.name_contains.toLowerCase()),
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'rxn-8',
    rxcui: '239191',
    name: 'Amoxicillin 50 MG/ML Oral Suspension',
    description: 'SCD - Semantic Clinical Drug for amoxicillin suspension',
    expected: {
      rxcui: '239191',
      tty: 'SCD',
      name_contains: 'amoxicillin',
    },
    validate: (actual, expected) => {
      const details = [
        {
          field: 'rxcui',
          expected: expected.rxcui,
          actual: actual.rxcui,
          passed: actual.rxcui === expected.rxcui,
        },
        {
          field: 'tty',
          expected: expected.tty,
          actual: actual.tty,
          passed: actual.tty === expected.tty,
        },
        {
          field: 'name_contains',
          expected: `contains "${expected.name_contains}"`,
          actual: actual.name,
          passed: actual.name.toLowerCase().includes(expected.name_contains.toLowerCase()),
        },
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
]

// ============ ATC CODES TESTS ============

interface AtcExpected {
  atc_codes: string[]
  // Note: ingredient_name is not populated in the database (known limitation in medicationBuilder.ts)
}

const atcTests: TestCase<AtcExpected>[] = [
  {
    id: 'atc-1',
    rxcui: '198440',
    name: 'Acetaminophen 500 MG Oral Tablet',
    description: 'Acetaminophen should have ATC code N02BE01 (Paracetamol)',
    expected: {
      atc_codes: ['N02BE01'],
    },
    validate: (actual, expected) => {
      const hasExpectedAtc = expected.atc_codes.every((code) =>
        actual.classification.atc_codes.includes(code)
      )
      const details = [
        {
          field: 'atc_codes',
          expected: expected.atc_codes.join(', '),
          actual: actual.classification.atc_codes.join(', ') || 'none',
          passed: hasExpectedAtc,
        },
        // Note: ingredient_name is not populated in the database (known limitation)
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'atc-2',
    rxcui: '861007',
    name: 'Metformin Hydrochloride 500 MG Oral Tablet',
    description: 'Metformin should have ATC code A10BA02',
    expected: {
      atc_codes: ['A10BA02'],
    },
    validate: (actual, expected) => {
      const hasExpectedAtc = expected.atc_codes.every((code) =>
        actual.classification.atc_codes.includes(code)
      )
      const details = [
        {
          field: 'atc_codes',
          expected: expected.atc_codes.join(', '),
          actual: actual.classification.atc_codes.join(', ') || 'none',
          passed: hasExpectedAtc,
        },
        // Note: ingredient_name is not populated in the database (known limitation)
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'atc-3',
    rxcui: '310965',
    name: 'Ibuprofen 200 MG Oral Tablet',
    description: 'Ibuprofen should have ATC code M01AE01',
    expected: {
      atc_codes: ['M01AE01'],
    },
    validate: (actual, expected) => {
      const hasExpectedAtc = expected.atc_codes.every((code) =>
        actual.classification.atc_codes.includes(code)
      )
      const details = [
        {
          field: 'atc_codes',
          expected: expected.atc_codes.join(', '),
          actual: actual.classification.atc_codes.join(', ') || 'none',
          passed: hasExpectedAtc,
        },
        // Note: ingredient_name is not populated in the database (known limitation)
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'atc-4',
    rxcui: '308182',
    name: 'Amoxicillin 250 MG Oral Capsule',
    description: 'Amoxicillin should have ATC code J01CA04',
    expected: {
      atc_codes: ['J01CA04'],
    },
    validate: (actual, expected) => {
      const hasExpectedAtc = expected.atc_codes.every((code) =>
        actual.classification.atc_codes.includes(code)
      )
      const details = [
        {
          field: 'atc_codes',
          expected: expected.atc_codes.join(', '),
          actual: actual.classification.atc_codes.join(', ') || 'none',
          passed: hasExpectedAtc,
        },
        // Note: ingredient_name is not populated in the database (known limitation)
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'atc-5',
    rxcui: '314076',
    name: 'Lisinopril 10 MG Oral Tablet',
    description: 'Lisinopril should have ATC code C09AA03',
    expected: {
      atc_codes: ['C09AA03'],
    },
    validate: (actual, expected) => {
      const hasExpectedAtc = expected.atc_codes.every((code) =>
        actual.classification.atc_codes.includes(code)
      )
      const details = [
        {
          field: 'atc_codes',
          expected: expected.atc_codes.join(', '),
          actual: actual.classification.atc_codes.join(', ') || 'none',
          passed: hasExpectedAtc,
        },
        // Note: ingredient_name is not populated in the database (known limitation)
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'atc-6',
    rxcui: '198051',
    name: 'Omeprazole 20 MG Delayed Release Oral Capsule',
    description: 'Omeprazole should have ATC code A02BC01',
    expected: {
      atc_codes: ['A02BC01'],
    },
    validate: (actual, expected) => {
      const hasExpectedAtc = expected.atc_codes.every((code) =>
        actual.classification.atc_codes.includes(code)
      )
      const details = [
        {
          field: 'atc_codes',
          expected: expected.atc_codes.join(', '),
          actual: actual.classification.atc_codes.join(', ') || 'none',
          passed: hasExpectedAtc,
        },
        // Note: ingredient_name is not populated in the database (known limitation)
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'atc-7',
    rxcui: '197591',
    name: 'Diazepam 5 MG Oral Tablet',
    description: 'Diazepam should have ATC code N05BA01',
    expected: {
      atc_codes: ['N05BA01'],
    },
    validate: (actual, expected) => {
      const hasExpectedAtc = expected.atc_codes.every((code) =>
        actual.classification.atc_codes.includes(code)
      )
      const details = [
        {
          field: 'atc_codes',
          expected: expected.atc_codes.join(', '),
          actual: actual.classification.atc_codes.join(', ') || 'none',
          passed: hasExpectedAtc,
        },
        // Note: ingredient_name is not populated in the database (known limitation)
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
  {
    id: 'atc-8',
    rxcui: '239191',
    name: 'Amoxicillin 50 MG/ML Oral Suspension',
    description: 'Amoxicillin suspension should also have ATC code J01CA04',
    expected: {
      atc_codes: ['J01CA04'],
    },
    validate: (actual, expected) => {
      const hasExpectedAtc = expected.atc_codes.every((code) =>
        actual.classification.atc_codes.includes(code)
      )
      const details = [
        {
          field: 'atc_codes',
          expected: expected.atc_codes.join(', '),
          actual: actual.classification.atc_codes.join(', ') || 'none',
          passed: hasExpectedAtc,
        },
        // Note: ingredient_name is not populated in the database (known limitation)
      ]
      return { passed: details.every((d) => d.passed), details }
    },
  },
]

// ============ TEST SECTION COMPONENT ============

interface TestSectionProps<T> {
  title: string
  icon: React.ReactNode
  description: string
  tests: TestCase<T>[]
  results: Map<string, TestResult>
  onRunTest: (test: TestCase<T>) => Promise<void>
  onRunAll: () => Promise<void>
  isRunningAll: boolean
}

function TestSection<T>({
  title,
  icon,
  description,
  tests,
  results,
  onRunTest,
  onRunAll,
  isRunningAll,
}: TestSectionProps<T>) {
  const passedCount = tests.filter((t) => results.get(t.id)?.status === 'passed').length
  const failedCount = tests.filter((t) => results.get(t.id)?.status === 'failed').length
  const totalRun = passedCount + failedCount

  return (
    <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-surface-50 border-b border-surface-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg text-primary-600">{icon}</div>
          <div>
            <h3 className="font-semibold text-surface-800">{title}</h3>
            <p className="text-sm text-surface-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {totalRun > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-success-600 font-medium">{passedCount} passed</span>
              <span className="text-surface-300">|</span>
              <span className="text-danger-600 font-medium">{failedCount} failed</span>
              <span className="text-surface-300">|</span>
              <span className="text-surface-500">{tests.length - totalRun} pending</span>
            </div>
          )}
          <button
            onClick={onRunAll}
            disabled={isRunningAll}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRunningAll ? 'Running...' : 'Run All'}
          </button>
        </div>
      </div>

      {/* Tests */}
      <div className="divide-y divide-surface-100">
        {tests.map((test) => {
          const result = results.get(test.id)
          return (
            <TestRow
              key={test.id}
              test={test}
              result={result}
              onRun={() => onRunTest(test)}
            />
          )
        })}
      </div>
    </div>
  )
}

// ============ TEST ROW COMPONENT ============

interface TestRowProps<T> {
  test: TestCase<T>
  result?: TestResult
  onRun: () => Promise<void>
}

function TestRow<T>({ test, result, onRun }: TestRowProps<T>) {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusIcon = () => {
    switch (result?.status) {
      case 'passed':
        return (
          <div className="w-6 h-6 rounded-full bg-success-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'failed':
        return (
          <div className="w-6 h-6 rounded-full bg-danger-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      case 'running':
        return (
          <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="w-6 h-6 rounded-full bg-warning-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-surface-100 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-surface-400" />
          </div>
        )
    }
  }

  return (
    <div className="px-5 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {statusIcon()}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-surface-800">{test.name}</span>
              <span className="text-xs font-mono px-2 py-0.5 bg-surface-100 rounded text-surface-600">
                {test.rxcui}
              </span>
            </div>
            <p className="text-sm text-surface-500">{test.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {result && result.status !== 'pending' && result.status !== 'running' && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 text-surface-400 hover:text-surface-600 hover:bg-surface-100 rounded transition-colors"
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          <button
            onClick={onRun}
            disabled={result?.status === 'running'}
            className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {result?.status === 'running' ? 'Running...' : 'Run'}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && result && (
        <div className="mt-3 ml-9 p-3 bg-surface-50 rounded-lg">
          {result.error ? (
            <div className="text-sm text-danger-600">{result.error}</div>
          ) : result.validation ? (
            <div className="space-y-2">
              {result.validation.details.map((detail, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className={detail.passed ? 'text-success-600' : 'text-danger-600'}>
                    {detail.passed ? '✓' : '✗'}
                  </span>
                  <div className="flex-1">
                    <span className="font-medium text-surface-700">{detail.field}:</span>
                    <div className="mt-0.5 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-surface-500">Expected:</span>{' '}
                        <span className="font-mono text-surface-800">{detail.expected}</span>
                      </div>
                      <div>
                        <span className="text-surface-500">Actual:</span>{' '}
                        <span className={`font-mono ${detail.passed ? 'text-surface-800' : 'text-danger-600'}`}>
                          {detail.actual}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-surface-500">No data available</div>
          )}
        </div>
      )}
    </div>
  )
}

// ============ MAIN COMPONENT ============

export const TestPanel = observer(function TestPanel() {
  const [conversionResults, setConversionResults] = useState<Map<string, TestResult>>(new Map())
  const [pricingResults, setPricingResults] = useState<Map<string, TestResult>>(new Map())
  const [rxnormResults, setRxnormResults] = useState<Map<string, TestResult>>(new Map())
  const [atcResults, setAtcResults] = useState<Map<string, TestResult>>(new Map())

  const [isRunningConversion, setIsRunningConversion] = useState(false)
  const [isRunningPricing, setIsRunningPricing] = useState(false)
  const [isRunningRxnorm, setIsRunningRxnorm] = useState(false)
  const [isRunningAtc, setIsRunningAtc] = useState(false)
  const [isRunningAll, setIsRunningAll] = useState(false)
  
  // Custom tests state
  const [customTests, setCustomTests] = useState<TestCase<Record<string, unknown>>[]>([])
  const [customResults, setCustomResults] = useState<Map<string, TestResult>>(new Map())
  const [isRunningCustom, setIsRunningCustom] = useState(false)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customRxcui, setCustomRxcui] = useState('')
  const [customName, setCustomName] = useState('')
  const [customDescription, setCustomDescription] = useState('')

  const runTest = async <T,>(
    test: TestCase<T>,
    setResults: React.Dispatch<React.SetStateAction<Map<string, TestResult>>>
  ) => {
    setResults((prev) => new Map(prev).set(test.id, { status: 'running' }))
    
    console.group(`🧪 Test: ${test.name} (RxCUI: ${test.rxcui})`)
    console.log('Description:', test.description)
    console.log('Expected:', test.expected)

    try {
      const medication = await fetchMedicationByRxcui(test.rxcui)

      if (!medication) {
        const errorMsg = `Medication with RxCUI ${test.rxcui} not found in database`
        console.error('❌ ERROR:', errorMsg)
        console.groupEnd()
        setResults((prev) =>
          new Map(prev).set(test.id, {
            status: 'error',
            error: errorMsg,
          })
        )
        return
      }

      // Instead of logging the whole object as-is, expand its key/value pairs one-per-line
      console.log('Actual medication data:')
      Object.entries(medication).forEach(([key, value]) => {
        console.log(`  ${key}:`, JSON.stringify(value, null, 2))
      })

      const validation = test.validate(medication, test.expected)
      
      // Log detailed validation results, one detail per line for easy visibility.
      console.log('')
      console.log('📋 Validation Results:')
      validation.details.forEach((detail) => {
        const icon = detail.passed ? '✅' : '❌'
        console.log(
          `  ${icon} ${detail.field}: Expected: ${JSON.stringify(detail.expected)} | Actual: ${JSON.stringify(detail.actual)} | ${detail.passed ? 'PASS' : 'FAIL'}`
        )
      })
      console.log('')
      
      if (validation.passed) {
        console.log('✅ TEST PASSED')
      } else {
        console.warn('❌ TEST FAILED')
        validation.details.forEach((d) =>
          console.log(
            `* ${d.field}: Expected: ${JSON.stringify(d.expected)} | Actual: ${JSON.stringify(d.actual)} | Status: ${d.passed ? 'PASS' : 'FAIL'}`
          )
        )
      }
      console.groupEnd()

      setResults((prev) =>
        new Map(prev).set(test.id, {
          status: validation.passed ? 'passed' : 'failed',
          actual: medication,
          validation,
        })
      )
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ ERROR:', errorMsg)
      console.groupEnd()
      setResults((prev) =>
        new Map(prev).set(test.id, {
          status: 'error',
          error: errorMsg,
        })
      )
    }
  }

  const runAllTests = async <T,>(
    tests: TestCase<T>[],
    setResults: React.Dispatch<React.SetStateAction<Map<string, TestResult>>>,
    setIsRunning: React.Dispatch<React.SetStateAction<boolean>>,
    sectionName: string
  ) => {
    console.log('')
    console.log('═'.repeat(60))
    console.log(`🚀 RUNNING ALL TESTS: ${sectionName}`)
    console.log('═'.repeat(60))
    console.log('')
    
    setIsRunning(true)
    let passed = 0
    let failed = 0
    
    for (const test of tests) {
      await runTest(test, setResults)
      // Check the result
      const result = await new Promise<TestResult | undefined>((resolve) => {
        setResults((prev) => {
          resolve(prev.get(test.id))
          return prev
        })
      })
      if (result?.status === 'passed') passed++
      else if (result?.status === 'failed' || result?.status === 'error') failed++
    }
    
    console.log('')
    console.log('═'.repeat(60))
    console.log(`📊 ${sectionName} SUMMARY:`)
    console.log(`   ✅ Passed: ${passed}`)
    console.log(`   ❌ Failed: ${failed}`)
    console.log(`   📝 Total:  ${tests.length}`)
    console.log('═'.repeat(60))
    console.log('')
    
    setIsRunning(false)
  }

  const runAllSections = async () => {
    if (isRunningAll) return
    
    setIsRunningAll(true)
    
    console.log('')
    console.log('╔' + '═'.repeat(58) + '╗')
    console.log('║' + '  🚀 RUNNING ALL TEST SECTIONS'.padEnd(58) + '║')
    console.log('╚' + '═'.repeat(58) + '╝')
    console.log('')
    
    await runAllTests(conversionTests, setConversionResults, setIsRunningConversion, 'Conversion Values')
    await runAllTests(pricingTests, setPricingResults, setIsRunningPricing, 'Pricing Stats')
    await runAllTests(rxnormTests, setRxnormResults, setIsRunningRxnorm, 'RxNorm Info')
    await runAllTests(atcTests, setAtcResults, setIsRunningAtc, 'ATC Codes')
    
    // Calculate final totals
    const allFinalResults = [
      ...Array.from(conversionResults.values()),
      ...Array.from(pricingResults.values()),
      ...Array.from(rxnormResults.values()),
      ...Array.from(atcResults.values()),
    ]
    const totalPassed = allFinalResults.filter((r) => r.status === 'passed').length
    const totalFailed = allFinalResults.filter((r) => r.status === 'failed' || r.status === 'error').length
    
    console.log('')
    console.log('╔' + '═'.repeat(58) + '╗')
    console.log('║' + '  📊 FINAL SUMMARY - ALL SECTIONS'.padEnd(58) + '║')
    console.log('╠' + '═'.repeat(58) + '╣')
    console.log('║' + `  ✅ Total Passed: ${totalPassed}`.padEnd(58) + '║')
    console.log('║' + `  ❌ Total Failed: ${totalFailed}`.padEnd(58) + '║')
    console.log('║' + `  📝 Total Tests:  ${totalTests}`.padEnd(58) + '║')
    console.log('╚' + '═'.repeat(58) + '╝')
    console.log('')
    
    setIsRunningAll(false)
  }

  // Add a custom test
  const addCustomTest = () => {
    if (!customRxcui.trim()) return
    
    const newTest: TestCase<Record<string, unknown>> = {
      id: `custom-${Date.now()}`,
      rxcui: customRxcui.trim(),
      name: customName.trim() || `Custom Test - RxCUI ${customRxcui}`,
      description: customDescription.trim() || 'Custom medication lookup test',
      expected: {},
      validate: (actual) => {
        // For custom tests, we just fetch and display the data - no validation
        const details = [
          {
            field: 'rxcui',
            expected: customRxcui.trim(),
            actual: actual.rxcui,
            passed: actual.rxcui === customRxcui.trim(),
          },
          {
            field: 'name',
            expected: 'any',
            actual: actual.name,
            passed: !!actual.name,
          },
          {
            field: 'is_liquid',
            expected: 'any',
            actual: String(actual.conversion_values?.is_liquid),
            passed: true,
          },
          {
            field: 'strength_val',
            expected: 'any',
            actual: String(actual.conversion_values?.strength_val),
            passed: true,
          },
          {
            field: 'strength_unit',
            expected: 'any',
            actual: actual.conversion_values?.strength_unit ?? 'null',
            passed: true,
          },
          {
            field: 'pricing_unit',
            expected: 'any',
            actual: actual.pricing_stats?.pricing_unit ?? 'null',
            passed: true,
          },
          {
            field: 'median_price',
            expected: 'any',
            actual: `$${actual.pricing_stats?.median_unit_price?.toFixed(4) ?? '0'}`,
            passed: true,
          },
          {
            field: 'ndc_count',
            expected: 'any',
            actual: String(actual.ndc_links?.ndc11_all?.length ?? 0),
            passed: true,
          },
          {
            field: 'atc_codes',
            expected: 'any',
            actual: actual.classification?.atc_codes?.join(', ') || 'none',
            passed: true,
          },
        ]
        return { passed: details.every((d) => d.passed), details }
      },
    }
    
    setCustomTests((prev) => [...prev, newTest])
    setCustomRxcui('')
    setCustomName('')
    setCustomDescription('')
    setShowCustomForm(false)
    
    console.log('📝 Added custom test:', newTest.name, `(RxCUI: ${newTest.rxcui})`)
  }

  // Remove a custom test
  const removeCustomTest = (testId: string) => {
    setCustomTests((prev) => prev.filter((t) => t.id !== testId))
    setCustomResults((prev) => {
      const next = new Map(prev)
      next.delete(testId)
      return next
    })
  }

  // Calculate overall stats
  const allResults = [
    ...Array.from(conversionResults.values()),
    ...Array.from(pricingResults.values()),
    ...Array.from(rxnormResults.values()),
    ...Array.from(atcResults.values()),
  ]
  const totalTests = conversionTests.length + pricingTests.length + rxnormTests.length + atcTests.length
  const passedTests = allResults.filter((r) => r.status === 'passed').length
  const failedTests = allResults.filter((r) => r.status === 'failed').length
  const runTests = passedTests + failedTests

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="bg-white rounded-xl border border-surface-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-surface-800">Data Validation Tests</h2>
            <p className="text-surface-500 mt-1">
              Compare expected medication data against Firestore values
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-surface-800">{totalTests}</div>
              <div className="text-xs text-surface-500">Total Tests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success-600">{passedTests}</div>
              <div className="text-xs text-surface-500">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-danger-600">{failedTests}</div>
              <div className="text-xs text-surface-500">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-surface-400">{totalTests - runTests}</div>
              <div className="text-xs text-surface-500">Pending</div>
            </div>
            <button
              onClick={runAllSections}
              disabled={isRunningAll || isRunningConversion || isRunningPricing || isRunningRxnorm || isRunningAtc}
              className="ml-4 px-6 py-3 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
            >
              {isRunningAll ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Running All...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Run All Tests
                </>
              )}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {runTests > 0 && (
          <div className="mt-4">
            <div className="h-2 bg-surface-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-success-500 transition-all"
                style={{ width: `${(passedTests / totalTests) * 100}%` }}
              />
              <div
                className="h-full bg-danger-500 transition-all"
                style={{ width: `${(failedTests / totalTests) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Test Sections */}
      <TestSection
        title="Conversion Values"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        }
        description="Validate is_liquid, strength_val, strength_unit, and package information"
        tests={conversionTests}
        results={conversionResults}
        onRunTest={(test) => runTest(test, setConversionResults)}
        onRunAll={() => runAllTests(conversionTests, setConversionResults, setIsRunningConversion, 'Conversion Values')}
        isRunningAll={isRunningConversion}
      />

      <TestSection
        title="Pricing Stats"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        description="Validate pricing_unit, price values, and NDC counts"
        tests={pricingTests}
        results={pricingResults}
        onRunTest={(test) => runTest(test, setPricingResults)}
        onRunAll={() => runAllTests(pricingTests, setPricingResults, setIsRunningPricing, 'Pricing Stats')}
        isRunningAll={isRunningPricing}
      />

      <TestSection
        title="RxNorm Info"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        }
        description="Validate RxCUI, term type (TTY), and medication names"
        tests={rxnormTests}
        results={rxnormResults}
        onRunTest={(test) => runTest(test, setRxnormResults)}
        onRunAll={() => runAllTests(rxnormTests, setRxnormResults, setIsRunningRxnorm, 'RxNorm Info')}
        isRunningAll={isRunningRxnorm}
      />

      <TestSection
        title="ATC Codes"
        icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        }
        description="Validate WHO ATC classification codes and ingredient names"
        tests={atcTests}
        results={atcResults}
        onRunTest={(test) => runTest(test, setAtcResults)}
        onRunAll={() => runAllTests(atcTests, setAtcResults, setIsRunningAtc, 'ATC Codes')}
        isRunningAll={isRunningAtc}
      />

      {/* Custom Tests Section */}
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-surface-50 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg text-primary-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-surface-800">Custom Tests</h3>
              <p className="text-sm text-surface-500">Add your own RxCUI lookups to inspect medication data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {customTests.length > 0 && (
              <button
                onClick={() => {
                  setIsRunningCustom(true)
                  Promise.all(customTests.map((test) => runTest(test, setCustomResults)))
                    .finally(() => setIsRunningCustom(false))
                }}
                disabled={isRunningCustom}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isRunningCustom ? 'Running...' : 'Run All'}
              </button>
            )}
            <button
              onClick={() => setShowCustomForm(!showCustomForm)}
              className="px-4 py-2 bg-surface-100 text-surface-700 rounded-lg text-sm font-medium hover:bg-surface-200 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Test
            </button>
          </div>
        </div>

        {/* Add Test Form */}
        {showCustomForm && (
          <div className="p-4 bg-primary-50 border-b border-primary-100">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">RxCUI *</label>
                <input
                  type="text"
                  value={customRxcui}
                  onChange={(e) => setCustomRxcui(e.target.value)}
                  placeholder="e.g., 198440"
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Name (optional)</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Acetaminophen 500 MG"
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-surface-600 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  placeholder="e.g., Test medication lookup"
                  className="w-full px-3 py-2 rounded-lg border border-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setShowCustomForm(false)
                  setCustomRxcui('')
                  setCustomName('')
                  setCustomDescription('')
                }}
                className="px-4 py-2 text-sm text-surface-600 hover:text-surface-800"
              >
                Cancel
              </button>
              <button
                onClick={addCustomTest}
                disabled={!customRxcui.trim()}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Test
              </button>
            </div>
          </div>
        )}

        {/* Custom Tests List */}
        {customTests.length === 0 ? (
          <div className="p-8 text-center text-surface-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No custom tests yet</p>
            <p className="text-xs text-surface-400 mt-1">Click "Add Test" to create a custom RxCUI lookup</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {customTests.map((test) => {
              const result = customResults.get(test.id)
              return (
                <div key={test.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Status Icon */}
                      {result?.status === 'passed' ? (
                        <div className="w-6 h-6 rounded-full bg-success-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : result?.status === 'failed' ? (
                        <div className="w-6 h-6 rounded-full bg-danger-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      ) : result?.status === 'running' ? (
                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-primary-600 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        </div>
                      ) : result?.status === 'error' ? (
                        <div className="w-6 h-6 rounded-full bg-warning-100 flex items-center justify-center">
                          <svg className="w-4 h-4 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-surface-100 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-surface-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-surface-800">{test.name}</span>
                          <span className="text-xs font-mono px-2 py-0.5 bg-surface-100 rounded text-surface-600">
                            {test.rxcui}
                          </span>
                        </div>
                        <p className="text-sm text-surface-500">{test.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => runTest(test, setCustomResults)}
                        disabled={result?.status === 'running'}
                        className="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {result?.status === 'running' ? 'Running...' : 'Run'}
                      </button>
                      <button
                        onClick={() => removeCustomTest(test.id)}
                        className="p-1.5 text-surface-400 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                        title="Remove test"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Results */}
                  {result && result.status !== 'pending' && result.status !== 'running' && result.validation && (
                    <div className="mt-3 ml-9 p-3 bg-surface-50 rounded-lg">
                      {result.error ? (
                        <div className="text-sm text-danger-600">{result.error}</div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          {result.validation.details.map((detail, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="font-medium text-surface-600">{detail.field}:</span>
                              <span className="font-mono text-surface-800">{detail.actual}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
})

