import React, { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Loader2, MapPin, Navigation, Search, X } from "lucide-react";
import { db } from "../lib/db";
import type { GooglePlaceDetails, GooglePlaceSuggestion } from "../types";

type GooglePlacePickerProps = {
  lang: "sw" | "en";
  value: string;
  selectedPlace?: GooglePlaceDetails | null;
  onAddressChange: (value: string) => void;
  onPlaceSelect: (place: GooglePlaceDetails | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  helperText?: string;
  compact?: boolean;
};

export function GooglePlacePicker({
  lang,
  value,
  selectedPlace,
  onAddressChange,
  onPlaceSelect,
  label,
  placeholder,
  error,
  helperText,
  compact = false,
}: GooglePlacePickerProps) {
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState<GooglePlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const skipNextSearchRef = useRef(false);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    const clean = query.trim();
    if (clean.length < 3) {
      setSuggestions([]);
      return;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setServiceError("");
      db.searchPlaces(clean, lang)
        .then((items) => {
          if (active) setSuggestions(items);
        })
        .catch((error) => {
          console.warn("Google Places search failed:", error);
          if (active) {
            setSuggestions([]);
            setServiceError(
              lang === "sw"
                ? "Google Places haipatikani kwa sasa. Unaweza kuandika eneo manually."
                : "Google Places is unavailable. You can type the address manually.",
            );
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 320);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, lang]);

  const mapPreviewUrl = useMemo(() => {
    if (!selectedPlace) return "";
    return `/api/v1/places/static-map?lat=${encodeURIComponent(selectedPlace.lat)}&lng=${encodeURIComponent(selectedPlace.lng)}&zoom=15&size=640x260`;
  }, [selectedPlace]);

  const chooseSuggestion = async (suggestion: GooglePlaceSuggestion) => {
    setDetailsLoading(true);
    setServiceError("");
    try {
      const place = await db.getPlaceDetails(suggestion.placeId, lang);
      skipNextSearchRef.current = true;
      setQuery(place.formattedAddress || suggestion.description);
      setSuggestions([]);
      onAddressChange(place.formattedAddress || suggestion.description);
      onPlaceSelect(place);
    } catch (error) {
      console.warn("Google Place details failed:", error);
      setServiceError(
        lang === "sw"
          ? "Imeshindwa kuthibitisha eneo hili. Tafadhali chagua tena au andika manually."
          : "Could not verify this place. Please try again or type manually.",
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  const clearPlace = () => {
    setQuery("");
    setSuggestions([]);
    onAddressChange("");
    onPlaceSelect(null);
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-black uppercase tracking-wider text-slate-500">
          {label}
        </label>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="text"
          value={query}
          autoComplete="street-address"
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            onAddressChange(next);
            if (selectedPlace) onPlaceSelect(null);
          }}
          className={`w-full rounded-2xl border bg-white pl-10 pr-11 text-sm font-bold outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 ${
            compact ? "py-2.5" : "py-3.5"
          } ${error ? "border-rose-300" : "border-slate-200"}`}
          placeholder={
            placeholder ||
            (lang === "sw"
              ? "Tafuta eneo kwenye Google Maps..."
              : "Search location on Google Maps...")
          }
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {(loading || detailsLoading) && <Loader2 size={16} className="animate-spin text-emerald-600" />}
          {query && !loading && !detailsLoading && (
            <button
              type="button"
              onClick={clearPlace}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label={lang === "sw" ? "Futa eneo" : "Clear location"}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {suggestions.length > 0 && (
          <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-[80] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.placeId}
                type="button"
                onClick={() => chooseSuggestion(suggestion)}
                className="flex w-full items-start gap-3 border-b border-slate-100 px-3 py-3 text-left transition last:border-b-0 hover:bg-emerald-50"
              >
                <MapPin size={17} className="mt-0.5 shrink-0 text-emerald-600" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-slate-900">
                    {suggestion.mainText || suggestion.description}
                  </span>
                  <span className="block truncate text-[11px] font-semibold text-slate-500">
                    {suggestion.secondaryText || suggestion.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {(error || serviceError || helperText) && (
        <p className={`text-[11px] font-semibold ${error ? "text-rose-600" : serviceError ? "text-amber-700" : "text-slate-500"}`}>
          {error || serviceError || helperText}
        </p>
      )}

      {selectedPlace && (
        <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50/60">
          <div className="flex items-start gap-2 px-3 py-2.5 text-xs font-bold text-emerald-900">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <p className="truncate">{selectedPlace.formattedAddress}</p>
              <p className="mt-0.5 text-[10px] font-semibold text-emerald-700">
                {selectedPlace.lat.toFixed(5)}, {selectedPlace.lng.toFixed(5)}
              </p>
            </div>
          </div>
          {mapPreviewUrl && (
            <div className="relative h-36 overflow-hidden border-t border-emerald-100 bg-slate-100">
              <img
                src={mapPreviewUrl}
                alt={lang === "sw" ? "Ramani ya eneo ulilochagua" : "Selected location map"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              {selectedPlace.googleMapsUri && (
                <a
                  href={selectedPlace.googleMapsUri}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-slate-950/90 px-3 py-1.5 text-[10px] font-black uppercase text-white shadow-lg"
                >
                  <Navigation size={12} />
                  {lang === "sw" ? "Fungua Maps" : "Open Maps"}
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GooglePlacePicker;
