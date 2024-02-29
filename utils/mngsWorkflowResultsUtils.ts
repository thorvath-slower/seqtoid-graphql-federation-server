// generic function to format nt/nr counts
const formatNtNrCounts = (taxId: string, taxInfo: any, countType: string) => {
    const hit = taxInfo[countType];
    return {
        tax_id: parseInt(taxId),
        count_type: countType.toUpperCase(),
        count: hit.count,
        base_count: hit.base_count,
        rpm: hit.rpm,
        bpm: hit.bpm,
        aligment_length: hit.alignment_length,
        percent_identity: hit.percent_identity,
        e_value: hit.e_value,
        fed_bg_mean: hit.bg_mean,
        fed_bg_stdev: hit.bg_stdev,
        fed_bg_mean_mass_normalized: hit.bg_mean_mass_normalized,
        fed_bg_stdev_mass_normalized: hit.bg_stdev_mass_normalized,
        fed_bg_zscore: hit.bg_zscore,
        fed_max_z_score: taxInfo.max_z_score,
        fed_agg_score: taxInfo.agg_score,
    }
}

export const formatTaxonHits = (counts: any) => {
    const speciesCounts = counts?.["1"] || {};
    const genusCounts = counts?.["2"] || {};

    const taxonHits : any[] = []
    const taxonCounts = Object.entries({...speciesCounts,...genusCounts});
    taxonCounts.forEach(([taxId, taxInfo] : [string, any]) => {
      if ("nt" in taxInfo) {
        taxonHits.push(formatNtNrCounts(taxId, taxInfo, "nt"));
      }
      if ("nr" in taxInfo) {
        taxonHits.push(formatNtNrCounts(taxId, taxInfo, "nr"));
      }
    });
    return taxonHits;
}

interface LineageType {
  [key: number]: TaxInfoType
};

type TaxInfoType = {
  name: string;
  rank: string;
};

// Note that the tax_id, name, and rank data returned here are computed values
// and not db values. Refer to encode_taxon_lineage in the czid-web-private repo.
export const formatTaxonLineage = (lineage: LineageType) => {
  return Object.entries(lineage).map(([taxId, taxInfo] : [string, TaxInfoType]) => {
    return {
      tax_id: taxId,
      name: taxInfo.name,
      rank: taxInfo.rank,
    }
  });
}
