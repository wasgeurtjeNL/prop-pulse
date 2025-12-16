import { NextResponse } from 'next/server';
import { getProperties } from '@/lib/actions/property.actions';
import { transformPropertiesToTemplate } from '@/lib/adapters/property-adapter';

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    
    // Fetch properties from database with all filters
    const properties = await getProperties({
      query: searchParams.get('query') || undefined,
      type: searchParams.get('type') || undefined,
      category: searchParams.get('category') || undefined,
      beds: searchParams.get('beds') || undefined,
      baths: searchParams.get('baths') || undefined,
      amenities: searchParams.get('amenities') || undefined,
    });
    
    // Transform to frontend format
    const propertyHomes = transformPropertiesToTemplate(properties);
    
    return NextResponse.json({ propertyHomes });
  } catch (error) {
    console.error('Error fetching properties:', error);
    
    // Return empty array on error - no demo data
    return NextResponse.json({ 
      propertyHomes: [] 
    });
  }
};

