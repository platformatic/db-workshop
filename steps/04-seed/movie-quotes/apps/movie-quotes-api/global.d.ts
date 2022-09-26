import { Entity } from '@platformatic/sql-mapper';
import graphqlPlugin from '@platformatic/sql-graphql';
import { Quote } from './types/Quote'
import { Movie } from './types/Movie'

declare module '@platformatic/sql-mapper' {
  interface Entities {
    quote: Entity<Quote>,
    movie: Entity<Movie>,
  }
}
