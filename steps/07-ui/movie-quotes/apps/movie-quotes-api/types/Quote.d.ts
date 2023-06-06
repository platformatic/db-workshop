/**
 * Quote
 * A Quote
 */
declare interface Quote {
    id?: number;
    quote: string;
    saidBy: string;
    createdAt?: string | null;
    movieId?: number | null;
    likes?: number | null;
}
export { Quote };
