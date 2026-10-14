"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Star } from "lucide-react";

import { submitReviewAction } from "@/lib/actions/review";
import {
  reviewSchema,
  type ReviewFormValues,
} from "@/lib/validations/review";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ReviewFormProps = {
  validationRequestId: string;
};

export function ReviewForm({ validationRequestId }: ReviewFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      validation_request_id: validationRequestId,
      rating: 0,
      what_works_well: "",
      improvement_areas: "",
      recommendations: "",
    },
  });

  const rating = watch("rating");

  const onSubmit = (values: ReviewFormValues) => {
    setError(null);
    startTransition(async () => {
      const result = await submitReviewAction(values);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/validations/${validationRequestId}`);
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <input type="hidden" {...register("validation_request_id")} />
      <input type="hidden" {...register("rating", { valueAsNumber: true })} />

      <div className="space-y-2">
        <Label>Project rating</Label>
        <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((value) => {
            const selected = rating >= value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                className="rounded-md p-1 text-muted-foreground transition hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() =>
                  setValue("rating", value, { shouldValidate: true })
                }
              >
                <Star
                  className={`h-7 w-7 ${selected ? "fill-primary text-primary" : ""}`}
                />
              </button>
            );
          })}
        </div>
        {errors.rating ? (
          <p className="text-sm text-destructive">{errors.rating.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="what_works_well">What works well</Label>
        <Textarea
          id="what_works_well"
          placeholder="Strengths, clarity, execution, or user value."
          {...register("what_works_well")}
        />
        {errors.what_works_well ? (
          <p className="text-sm text-destructive">
            {errors.what_works_well.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="improvement_areas">Improvement areas</Label>
        <Textarea
          id="improvement_areas"
          placeholder="Gaps, risks, or friction reviewers should flag."
          {...register("improvement_areas")}
        />
        {errors.improvement_areas ? (
          <p className="text-sm text-destructive">
            {errors.improvement_areas.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="recommendations">Recommendations</Label>
        <Textarea
          id="recommendations"
          placeholder="Concrete next steps for the builder."
          {...register("recommendations")}
        />
        {errors.recommendations ? (
          <p className="text-sm text-destructive">
            {errors.recommendations.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save review"}
      </Button>
    </form>
  );
}
