// First, modify the checkPromotion function to return matching items for each promotion
const checkPromotionsForOrder = (orderItems) => {
    const now = new Date();
    const appliedPromotions = [];
    
    // Create a copy of items to track which ones have been used in promotions
    const remainingItems = [...orderItems];
    
    for (const promo of promotions) {
      const startDate = new Date(promo.Start_date);
      const endDate = new Date(promo.End_date);
      
      if (now >= startDate && now <= endDate) {
        // For each promotion, check if it can be applied
        const matchingItems = [];
        
        // Check if promotion requires specific items or combinations
        if (promo.items && promo.items.length > 0) {
          // For item-specific promotions (e.g., "buy item A and B")
          const requiredItems = [...promo.items];
          
          // Try to match all required items for this promotion
          let allRequiredItemsFound = true;
          
          
          for (const requiredItem of requiredItems) {
            // Find a matching item that hasn't been used in another promotion yet
            const matchIndex = remainingItems.findIndex(orderItem => {
              if (requiredItem.Menu_id && orderItem.Menu_id === requiredItem.Menu_id) {
                return true;
              }
              
              if (requiredItem.Noodlemenu && orderItem.Noodle_type_id) {
                // For noodle-type promotions, additional logic can be added here
                return true;
              }
              
              return false;
            });
            
            if (matchIndex === -1) {
              allRequiredItemsFound = false;
              break;
            }
            
            // Add the item to the matching items for this promotion
            matchingItems.push(remainingItems[matchIndex]);
            
            // Remove the used item
            remainingItems.splice(matchIndex, 1);
          }
          
          // If all required items were found, add this promotion to applied promotions
          if (allRequiredItemsFound && matchingItems.length > 0) {
            appliedPromotions.push({
              promotionId: promo.Promotion_id,
              promotionName: promo.Promotion_name,
              discountValue: promo.Discount_value,
              items: matchingItems
            });
          } else {
            // If we couldn't complete the promotion, put the items back
            matchingItems.forEach(item => remainingItems.push(item));
          }
        } else {
          // Handle single-item promotions (if any)
          // This would be similar to your original approach
        }
      }
    }
    
    return {
      appliedPromotions,
      remainingItems
    };
  };
  
  // Then modify the calculateCheckedItemsTotal function
  const calculateCheckedItemsTotal = (orderId) => {
    const order = orders.find(o => o.Order_id === orderId);
    
    // Get only the checked items
    const checkedOrderItems = order.details.filter(item => 
      checkedItems[orderId]?.[item.Order_detail_id]
    );
    
    if (checkedOrderItems.length === 0) return 0;
    
    // Apply promotions to the checked items
    const { appliedPromotions, remainingItems } = checkPromotionsForOrder(checkedOrderItems);
    
    // Calculate the base total for all items
    const baseTotal = checkedOrderItems.reduce((total, item) => {
      return total + (item.Order_detail_price * item.Order_detail_quantity);
    }, 0);
    
    // Calculate total discount from all applied promotions
    const totalDiscount = appliedPromotions.reduce((discount, promo) => {
      return discount + promo.discountValue;
    }, 0);
    
    // Set up appliedPromotionsData for displaying promotion information
    const appliedPromotionsData = appliedPromotions.map(promo => ({
      promotionId: promo.promotionId,
      promotionName: promo.promotionName,
      discountValue: promo.discountValue,
      items: promo.items.map(item => ({
        id: item.Order_detail_id,
        name: getItemDetails(item)?.name || 'Unknown item'
      }))
    }));
    
    // Store applied promotions information in state if needed
    // (You would add this state with useState at the top of the component)
    // setOrderPromotions(prevState => ({
    //   ...prevState,
    //   [orderId]: appliedPromotionsData
    // }));
    
    // Return total after discount
    return baseTotal - totalDiscount;
  };